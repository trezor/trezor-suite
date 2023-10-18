package io.trezor.rnusb

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.os.Build
import android.util.Log

typealias OnDeviceDisconnect = (deviceName: String) -> Unit

class ReactNativeUsbDetachedReceiver() : BroadcastReceiver() {

    companion object {
        private var onDeviceDisconnectCallback: OnDeviceDisconnect? = null

        fun setOnDeviceDisconnectCallback(callback: OnDeviceDisconnect?) {
            onDeviceDisconnectCallback = callback
        }
    }
    override fun onReceive(context: Context, intent: Intent) {
        if (UsbManager.ACTION_USB_DEVICE_DETACHED == intent.action) {
            val device: UsbDevice? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                intent.getParcelableExtra(UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
            } else {
                intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)
            }
            device?.apply {
                Log.d("ReactNativeUSB", "USB device disconnected: $device")

                onDeviceDisconnectCallback?.invoke(device.deviceName)
            }
        }
    }
}