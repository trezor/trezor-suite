package io.trezor.rnusb

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.hardware.usb.UsbManager
import android.hardware.usb.UsbDevice
import android.os.Build
import android.util.Log

typealias OnDeviceConnect = (UsbDevice) -> Unit
class ReactNativeUsbAttachedReceiver() : BroadcastReceiver() {

    companion object {
        private var onDeviceConnectCallback: OnDeviceConnect? = null

        fun setOnDeviceConnectCallback(callback: OnDeviceConnect?) {
            onDeviceConnectCallback = callback
        }
    }
    override fun onReceive(context: Context, intent: Intent) {
        if (UsbManager.ACTION_USB_DEVICE_ATTACHED == intent.action) {
            val device: UsbDevice? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                intent.getParcelableExtra(UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
            } else {
                intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)
            }
            device?.let {
                Log.d("ReactNativeUSB", "USB device attached: $device")

                onDeviceConnectCallback?.invoke(device)

            }
        }
    }
}
