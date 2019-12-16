package io.trezor.suite;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;

import io.trezor.suite.bridge.USBBridge;

public class UsbActivity extends Activity {
    @Override
    protected void onStart() {
        Intent intent = getIntent();
        String action = intent.getAction();
        if (UsbManager.ACTION_USB_DEVICE_ATTACHED.equals(action)) {
            UsbManager usbManager = (UsbManager) getApplicationContext().getSystemService(Context.USB_SERVICE);
            UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
            USBBridge bridge = USBBridge.getInstance(getApplicationContext());
            if (usbManager.hasPermission(device)) {
                bridge.addDeviceToList(new USBBridge.TrezorDevice(device));
            }
        }
        // If this activity is on top of the stack (no other activity is running
        // we launch the real MainActivity.
        if (this.isTaskRoot()){
            Intent startIntent = new Intent(getApplicationContext(), MainActivity.class);
            startIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(startIntent);
        }
        finish();
        super.onStart();
    }
}
