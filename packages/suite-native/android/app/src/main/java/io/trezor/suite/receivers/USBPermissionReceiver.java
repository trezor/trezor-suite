package io.trezor.suite.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.util.Log;

import io.trezor.suite.bridge.USBBridge;

public class USBPermissionReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d("USBPermissionReceiver", "received intent "+intent.toString());
        String action = intent.getAction();
        UsbDevice device = (UsbDevice)intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
        if ("io.trezor.suite.USB_PERMISSION".equals(action)) {
            if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                Log.d("USBPermissionReceiver", "permission granted");
                USBBridge usbBridge = USBBridge.getInstance(context);
                usbBridge.addDeviceToList(new USBBridge.TrezorDevice(device));
            }
        }
    }
}
