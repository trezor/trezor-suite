package io.trezor.suite.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;

import io.trezor.suite.bridge.USBBridge;
import io.trezor.suite.interfaces.TrezorInterface;

public class DeviceAttachmentReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (UsbManager.ACTION_USB_DEVICE_ATTACHED.equals(action)) {
            UsbManager usbManager = (UsbManager)context.getSystemService(Context.USB_SERVICE);
            UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
            USBBridge bridge = USBBridge.getInstance(context);
            if (usbManager.hasPermission(device)) {
                bridge.addDeviceToList(new USBBridge.TrezorDevice(device));
            }
        }else if (UsbManager.ACTION_USB_DEVICE_DETACHED.equals(action)) {
            UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
            USBBridge bridge = USBBridge.getInstance(context);
            TrezorInterface oldDevice = bridge.getDeviceByPath(device.getSerialNumber());
            if (oldDevice!=null) {
                bridge.removeDeviceFromList(oldDevice);
            }
        }
    }
}
