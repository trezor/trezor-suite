package io.trezor.rnusb

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.hardware.usb.UsbManager
import android.hardware.usb.UsbDevice
import android.os.Build
import android.util.Log

typealias OnUsbDeviceAttachedCallback = (UsbDevice) -> Unit
typealias OnUsbDeviceDetachedCallback = (deviceName: String) -> Unit

class ReactNativeUsbBroadcastReceiver : BroadcastReceiver() {

    companion object {
        private var onUsbDeviceAttachedCallback: OnUsbDeviceAttachedCallback? = null
        private var onUsbDeviceDetachedCallback: OnUsbDeviceDetachedCallback? = null

        fun setOnUsbDeviceAttachedCallback(callback: OnUsbDeviceAttachedCallback?) {
            onUsbDeviceAttachedCallback = callback
        }

        fun setOnUsbDeviceDetachedCallback(callback: OnUsbDeviceDetachedCallback?) {
            onUsbDeviceDetachedCallback = callback
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == UsbManager.ACTION_USB_DEVICE_ATTACHED) {
            getDevice(intent)?.let { device ->
                Log.d(LOG_TAG, "USB device attached: $device")
                onUsbDeviceAttachedCallback?.invoke(device)
            }
        } else if (intent.action == UsbManager.ACTION_USB_DEVICE_DETACHED) {
            getDevice(intent)?.let { device ->
                Log.d(LOG_TAG, "USB device detached: $device")
                onUsbDeviceDetachedCallback?.invoke(device.deviceName)
            }
        }
    }

    private fun getDevice(intent: Intent): UsbDevice? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent.getParcelableExtra(UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
        } else {
            intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)
        }
    }

}
