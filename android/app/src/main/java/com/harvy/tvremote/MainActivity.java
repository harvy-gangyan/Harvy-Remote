package com.harvy.tvremote;

import android.app.PictureInPictureParams;
import android.content.Context;
import android.content.res.Configuration;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Rational;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private WifiManager.MulticastLock multicastLock;

    public class WebAppInterface {
        Context mContext;

        WebAppInterface(Context c) {
            mContext = c;
        }

        @JavascriptInterface
        public void enterPictureInPicture() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        try {
                            PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder();
                            // Aspect ratio matching the vertical 3-row mini remote (3:4 ratio for full button clearance)
                            Rational aspectRatio = new Rational(3, 4);
                            builder.setAspectRatio(aspectRatio);
                            enterPictureInPictureMode(builder.build());
                        } catch (Exception e) {
                            try {
                                enterPictureInPictureMode();
                            } catch (Exception ex) {
                                ex.printStackTrace();
                            }
                        }
                    }
                }
            });
        }

        @JavascriptInterface
        public void closeApp() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        finishAffinity();
                        System.exit(0);
                    } catch (Exception e) {
                        finish();
                    }
                }
            });
        }

        @JavascriptInterface
        public String getWifiSubnet() {
            try {
                WifiManager wifi = (WifiManager) mContext.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
                if (wifi != null) {
                    int ip = wifi.getConnectionInfo().getIpAddress();
                    if (ip != 0) {
                        return String.format("%d.%d.%d.", (ip & 0xff), (ip >> 8 & 0xff), (ip >> 16 & 0xff));
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return "192.168.1.";
        }

        @JavascriptInterface
        public boolean isPortOpen(String ip, int port, int timeoutMs) {
            try {
                java.net.Socket socket = new java.net.Socket();
                socket.connect(new java.net.InetSocketAddress(ip, port), timeoutMs > 0 ? timeoutMs : 250);
                socket.close();
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public String scanSubnetFast(String subnetBase, int startIp, int endIp, int timeoutMs) {
            final org.json.JSONArray found = new org.json.JSONArray();
            try {
                final int[] tvPorts = new int[]{8008, 8060, 4123, 8001, 3000, 80, 5555};
                final int timeout = timeoutMs > 0 ? timeoutMs : 200;
                final String base = subnetBase.endsWith(".") ? subnetBase : (subnetBase + ".");
                final int start = Math.max(1, startIp);
                final int end = Math.min(254, endIp);

                int threadCount = Math.min(30, (end - start + 1));
                java.util.concurrent.ExecutorService pool = java.util.concurrent.Executors.newFixedThreadPool(threadCount > 0 ? threadCount : 10);
                java.util.List<java.util.concurrent.Future<?>> futures = new java.util.ArrayList<>();

                for (int i = start; i <= end; i++) {
                    final String targetIp = base + i;
                    futures.add(pool.submit(new Runnable() {
                        @Override
                        public void run() {
                            for (int p : tvPorts) {
                                try {
                                    java.net.Socket s = new java.net.Socket();
                                    s.connect(new java.net.InetSocketAddress(targetIp, p), timeout);
                                    s.close();

                                    synchronized (found) {
                                        org.json.JSONObject obj = new org.json.JSONObject();
                                        obj.put("ip", targetIp);
                                        obj.put("openPort", p);
                                        found.put(obj);
                                    }
                                    break; // Port found on this IP, proceed to next
                                } catch (Exception ignored) {
                                }
                            }
                        }
                    }));
                }

                for (java.util.concurrent.Future<?> f : futures) {
                    try {
                        f.get((long) timeout * 3 + 400, java.util.concurrent.TimeUnit.MILLISECONDS);
                    } catch (Exception ignored) {}
                }
                pool.shutdownNow();
            } catch (Exception e) {
                e.printStackTrace();
            }
            return found.toString();
        }

        @JavascriptInterface
        public boolean hasIrBlaster() {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                    android.hardware.ConsumerIrManager ir = (android.hardware.ConsumerIrManager) mContext.getSystemService(Context.CONSUMER_IR_SERVICE);
                    return ir != null && ir.hasIrEmitter();
                }
            } catch (Exception e) {
                // ignore
            }
            return false;
        }

        @JavascriptInterface
        public boolean transmitIr(String brand, String keycode) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                    android.hardware.ConsumerIrManager ir = (android.hardware.ConsumerIrManager) mContext.getSystemService(Context.CONSUMER_IR_SERVICE);
                    if (ir != null && ir.hasIrEmitter()) {
                        int[] pattern = generateNecIrPattern(brand, keycode);
                        if (pattern != null && pattern.length > 0) {
                            ir.transmit(38000, pattern);
                            return true;
                        }
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return false;
        }

        private int[] generateNecIrPattern(String brand, String keycode) {
            // Standard NEC TV IR code sets (Address + Command)
            long code = 0;
            String b = brand != null ? brand.toLowerCase() : "tcl";
            String k = keycode != null ? keycode.toUpperCase() : "";

            if (b.contains("samsung")) {
                // Samsung TV Custom Code 0x0707
                if (k.contains("POWER")) code = 0xE0E040BF;
                else if (k.contains("VOL_UP") || k.contains("VOLUME_UP")) code = 0xE0E0E01F;
                else if (k.contains("VOL_DOWN") || k.contains("VOLUME_DOWN")) code = 0xE0E0D02F;
                else if (k.contains("MUTE")) code = 0xE0E0F00F;
                else if (k.contains("HOME")) code = 0xE0E09E61;
                else if (k.contains("UP")) code = 0xE0E006F9;
                else if (k.contains("DOWN")) code = 0xE0E08679;
                else if (k.contains("LEFT")) code = 0xE0E0A659;
                else if (k.contains("RIGHT")) code = 0xE0E046B9;
                else if (k.contains("CENTER") || k.contains("ENTER")) code = 0xE0E016E9;
                else if (k.contains("BACK")) code = 0xE0E01AE5;
                else if (k.contains("PLAY") || k.contains("PAUSE")) code = 0xE0E0E21D;
            } else if (b.contains("lg")) {
                // LG TV Custom Code 0x04FB
                if (k.contains("POWER")) code = 0x20DF10EF;
                else if (k.contains("VOL_UP") || k.contains("VOLUME_UP")) code = 0x20DF40BF;
                else if (k.contains("VOL_DOWN") || k.contains("VOLUME_DOWN")) code = 0x20DFC03F;
                else if (k.contains("MUTE")) code = 0x20DF906F;
                else if (k.contains("HOME")) code = 0x20DF3EC1;
                else if (k.contains("UP")) code = 0x20DF02FD;
                else if (k.contains("DOWN")) code = 0x20DF827D;
                else if (k.contains("LEFT")) code = 0x20DFE01F;
                else if (k.contains("RIGHT")) code = 0x20DF609F;
                else if (k.contains("CENTER") || k.contains("ENTER")) code = 0x20DF22DD;
                else if (k.contains("BACK")) code = 0x20DF14EB;
                else if (k.contains("PLAY")) code = 0x20DF0DF2;
                else if (k.contains("PAUSE")) code = 0x20DF5DA2;
            } else {
                // TCL / Generic Android TV NEC code
                if (k.contains("POWER")) code = 0xBF40BF;
                else if (k.contains("VOL_UP") || k.contains("VOLUME_UP")) code = 0xBF807F;
                else if (k.contains("VOL_DOWN") || k.contains("VOLUME_DOWN")) code = 0xBF41BE;
                else if (k.contains("MUTE")) code = 0xBF08F7;
                else if (k.contains("HOME")) code = 0xBF2AD5;
                else if (k.contains("UP")) code = 0xBF9A65;
                else if (k.contains("DOWN")) code = 0xBFAA55;
                else if (k.contains("LEFT")) code = 0xBFBA45;
                else if (k.contains("RIGHT")) code = 0xBFCA35;
                else if (k.contains("CENTER") || k.contains("ENTER")) code = 0xBF3AC5;
                else if (k.contains("BACK")) code = 0xBF22DD;
                else if (k.contains("PLAY") || k.contains("PAUSE")) code = 0xBF1AE5;
            }

            if (code == 0) return null;

            // Generate 32-bit NEC timing pattern (9000us leader, 4500us space, 560us pulse + 560/1690us space)
            int[] pattern = new int[67];
            pattern[0] = 9000;
            pattern[1] = 4500;
            int idx = 2;
            for (int i = 31; i >= 0; i--) {
                pattern[idx++] = 560;
                pattern[idx++] = ((code >> i) & 1) == 1 ? 1690 : 560;
            }
            pattern[idx] = 560; // trailing pulse
            return pattern;
        }

        @JavascriptInterface
        public String getPhoneHardwareInfo() {
            org.json.JSONObject info = new org.json.JSONObject();
            try {
                info.put("manufacturer", Build.MANUFACTURER != null ? Build.MANUFACTURER : "Unknown");
                info.put("model", Build.MODEL != null ? Build.MODEL : "Android Device");
                info.put("device", Build.DEVICE != null ? Build.DEVICE : "");
                info.put("androidVersion", Build.VERSION.RELEASE != null ? Build.VERSION.RELEASE : "");
                info.put("hasIrBlaster", hasIrBlaster());
            } catch (Exception ignored) {}
            return info.toString();
        }

        @JavascriptInterface
        public String sendHttpWithHeaders(String urlStr, String method, String body, String headersJson, int timeoutMs) {
            org.json.JSONObject result = new org.json.JSONObject();
            try {
                java.net.URL url = new java.net.URL(urlStr);
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestMethod(method != null ? method : "GET");
                conn.setConnectTimeout(timeoutMs > 0 ? timeoutMs : 750);
                conn.setReadTimeout(timeoutMs > 0 ? timeoutMs : 750);
                conn.setRequestProperty("User-Agent", "HarvyTVRemote/2.0");
                conn.setRequestProperty("Accept", "*/*");

                if (headersJson != null && !headersJson.trim().isEmpty()) {
                    try {
                        org.json.JSONObject h = new org.json.JSONObject(headersJson);
                        java.util.Iterator<String> keys = h.keys();
                        while (keys.hasNext()) {
                            String k = keys.next();
                            conn.setRequestProperty(k, h.optString(k));
                        }
                    } catch (Exception ignored) {}
                }

                if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || "DELETE".equalsIgnoreCase(method)) {
                    conn.setDoOutput(true);
                    byte[] bytes = (body != null && !body.isEmpty()) ? body.getBytes(java.nio.charset.StandardCharsets.UTF_8) : new byte[0];
                    conn.setFixedLengthStreamingMode(bytes.length);
                    try (java.io.OutputStream os = conn.getOutputStream()) {
                        if (bytes.length > 0) {
                            os.write(bytes);
                        }
                        os.flush();
                    }
                }
                int code = conn.getResponseCode();
                result.put("status", code);
                result.put("ok", code >= 200 && code < 400);

                java.io.InputStream is = code < 400 ? conn.getInputStream() : conn.getErrorStream();
                if (is != null) {
                    java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(is, java.nio.charset.StandardCharsets.UTF_8));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line).append("\n");
                    }
                    reader.close();
                    result.put("data", sb.toString());
                } else {
                    result.put("data", "");
                }
                conn.disconnect();
                return result.toString();
            } catch (Exception e) {
                try {
                    result.put("status", 0);
                    result.put("ok", false);
                    result.put("error", e.getMessage() != null ? e.getMessage() : e.toString());
                    result.put("data", "");
                } catch (Exception ex) {}
                return result.toString();
            }
        }

        @JavascriptInterface
        public String sendHttpFull(String urlStr, String method, String body, int timeoutMs) {
            return sendHttpWithHeaders(urlStr, method, body, null, timeoutMs);
        }

        @JavascriptInterface
        public boolean sendHttp(String urlStr, String method, String body, int timeoutMs) {
            String res = sendHttpFull(urlStr, method, body, timeoutMs);
            try {
                org.json.JSONObject obj = new org.json.JSONObject(res);
                return obj.optBoolean("ok", false);
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public boolean sendRawTcp(String ip, int port, String message, int timeoutMs) {
            try {
                java.net.Socket socket = new java.net.Socket();
                socket.connect(new java.net.InetSocketAddress(ip, port), timeoutMs > 0 ? timeoutMs : 1500);
                java.io.OutputStream os = socket.getOutputStream();
                os.write(message.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                os.flush();
                socket.close();
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public boolean pingIp(String ip, int timeoutMs) {
            try {
                java.net.InetAddress address = java.net.InetAddress.getByName(ip);
                return address.isReachable(timeoutMs > 0 ? timeoutMs : 800);
            } catch (Exception e) {
                return false;
            }
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Ensure window and status/navigation bars match dark theme (#070b13) with no grey borders
        try {
            int bgDark = android.graphics.Color.parseColor("#070b13");
            getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(bgDark));
            if (getWindow().getDecorView() != null) {
                getWindow().getDecorView().setBackgroundColor(bgDark);
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                getWindow().setStatusBarColor(bgDark);
                getWindow().setNavigationBarColor(bgDark);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Add JavaScript interface to bridge web app and native android
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().addJavascriptInterface(new WebAppInterface(this), "AndroidNativeRemote");
                getBridge().getWebView().setBackgroundColor(android.graphics.Color.parseColor("#070b13"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Acquire MulticastLock to enable automatic TV discovery (mDNS, SSDP, ZeroConf)
        try {
            WifiManager wifi = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wifi != null) {
                multicastLock = wifi.createMulticastLock("HarvyTVRemoteMulticastLock");
                multicastLock.setReferenceCounted(true);
                multicastLock.acquire();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode, Configuration newConfig) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('pipModeChanged', { detail: { isPiP: " + isInPictureInPictureMode + " } }));",
                    null
                );
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onUserLeaveHint() {
        super.onUserLeaveHint();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder();
                Rational aspectRatio = new Rational(3, 4);
                builder.setAspectRatio(aspectRatio);
                enterPictureInPictureMode(builder.build());
            }
        } catch (Exception e) {
            // ignore
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (multicastLock != null && multicastLock.isHeld()) {
            multicastLock.release();
        }
    }
}
