package io.trezor.rnusb

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.os.Build
import android.util.Log

const val ACTION_USB_PERMISSION = "io.trezor.rnusb.USB_PERMISSION"

typealias OnPermissionReceived = (UsbDevice) -> Unit
class ReactNativeUsbPermissionReceiver() : BroadcastReceiver() {

    companion object {
        private var onPermissionReceivedCallback: OnPermissionReceived? = null

        fun setOnPermissionReceivedCallback(callback: OnPermissionReceived?) {
            onPermissionReceivedCallback = callback
        }
    }
    override fun onReceive(context: Context, intent: Intent) {
        Log.d("ReactNativeUsb", "ReactNativeUsbPermissionReceiver.onReceive: $intent")
        if (ACTION_USB_PERMISSION == intent.action) {
            val device: UsbDevice? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                intent.getParcelableExtra(UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
            } else {
                intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)
            }

            if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                device?.let {
                    Log.d("ReactNativeUsb", "permission granted for device $device")
                    onPermissionReceivedCallback?.invoke(device)
                }
            } else {
                Log.d("ReactNativeUsb", "permission denied for device $device")
            }
        }
    }
}