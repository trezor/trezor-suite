package io.trezor.rnusb

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.hardware.usb.UsbManager
import android.hardware.usb.UsbDevice
import android.os.Build
import android.util.Log

typealias OnPermissionResolved = (Boolean, UsbDevice) -> Unit
class ReactNativeUsbPermissionReceiver() : BroadcastReceiver() {

    companion object {
        private var onDevicePermissionCallback: OnPermissionResolved? = null

        fun setOnDevicePermissionCallback(callback: OnPermissionResolved?) {
            onDevicePermissionCallback = callback
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (ACTION_USB_PERMISSION == intent.action) {
            synchronized(this) {
                val device: UsbDevice? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    intent.getParcelableExtra(UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
                } else {
                    intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)
                }
                val isPermissionGranted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)
                Log.d(LOG_TAG, "USB permission granted: $isPermissionGranted")

                device?.apply {
                    onDevicePermissionCallback?.invoke(isPermissionGranted, device)
                }
            }
        }
    }
}