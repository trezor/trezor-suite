package io.trezor.transport.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.util.Log;

import io.trezor.transport.bridges.USBBridge;
import io.trezor.transport.interfaces.TrezorInterface;

public class DeviceAttachmentReceiver extends BroadcastReceiver {
  private static final String TAG = "Trezor DeviceAttachmentReceiver";

  @Override
  public void onReceive(Context context, Intent intent) {
    String action = intent.getAction();
    UsbManager usbManager = (UsbManager) context.getSystemService(Context.USB_SERVICE);
    USBBridge bridge = USBBridge.getInstance(context);

    if (UsbManager.ACTION_USB_DEVICE_ATTACHED.equals(action)) {
      Log.d(TAG, "Trying to attach device");
      UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
      bridge.addDevice(device);

    } else if (UsbManager.ACTION_USB_DEVICE_DETACHED.equals(action)) {
      UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
      Log.d(TAG, "Trying to detach device " + device.toString());

      // TODO: Can you even getSerialNumber() of detached device? Because you don't have permission
      // We need to figure out some other way how to identify devices, for now it will remove all devices
      if (usbManager.hasPermission(device)) {
        // It never gets here
        Log.d(TAG, "Has permission to detach device");
        TrezorInterface oldDevice = bridge.getDeviceByPath(device.getSerialNumber());

        if (oldDevice != null) {
          bridge.removeDeviceFromList(oldDevice);
          Log.d(TAG, "Device removed from list");
        } else {
          Log.d(TAG, "Device not removed from list, because removed device is null");
          bridge.removeAllDevices();
        }

      } else {
        // It always end up here, because you never have permission
        Log.d(TAG, "Has not permission to detach device, detaching ALL devices");
        bridge.removeAllDevices();
      }
    }
  }
}
