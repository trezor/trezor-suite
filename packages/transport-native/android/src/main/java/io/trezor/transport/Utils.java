package io.trezor.transport;

import android.hardware.usb.UsbDevice;
import android.os.Build;

public class Utils {
  private static final char[] HEX_ARRAY = "0123456789ABCDEF".toCharArray();

  public static byte[] hexStringToByteArray(String s) {
    int len = s.length();
    byte[] data = new byte[len / 2];
    for (int i = 0; i < len; i += 2) {
      data[i / 2] = (byte) ((Character.digit(s.charAt(i), 16) << 4)
        + Character.digit(s.charAt(i + 1), 16));
    }
    return data;
  }

  public static String byteArrayToHexString(byte[] bytes) {
    char[] hexChars = new char[bytes.length * 2];
    for (int j = 0; j < bytes.length; j++) {
      int v = bytes[j] & 0xFF;
      hexChars[j * 2] = HEX_ARRAY[v >>> 4];
      hexChars[j * 2 + 1] = HEX_ARRAY[v & 0x0F];
    }
    return new String(hexChars);
  }

  public static int calculatePaddedLength(long n, long m) {
    return Math.round(n >= 0 ? ((n + m - 1) / m) * m : (n / m) * m);
  }

  public static boolean isEmulator() {
    return Build.FINGERPRINT.startsWith("generic")
      || Build.FINGERPRINT.startsWith("unknown")
      || Build.MODEL.contains("google_sdk")
      || Build.MODEL.contains("Emulator")
      || Build.MODEL.contains("Android SDK built for x86")
      || Build.MANUFACTURER.contains("Genymotion")
      || (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
      || "google_sdk".equals(Build.PRODUCT);
  }

  // TODO: maybe use values from res/xml?
  public static boolean deviceIsTrezor(UsbDevice usbDevice) {
    // no usable interfaces
    if (usbDevice.getInterfaceCount() <= 0) {
      return false;
    }
    // Trezor v1
    if (usbDevice.getVendorId() == 0x534c) {
      return usbDevice.getProductId() == 0x0001;
    }
    // Trezor v2
    if (usbDevice.getVendorId() == 0x1209) {
      return usbDevice.getProductId() == 0x53c0 || usbDevice.getProductId() == 0x53c1;
    }
    return false;
  }

}
