package io.trezor.rnusb

import android.app.PendingIntent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbDeviceConnection
import android.hardware.usb.UsbManager
import android.util.Log
import expo.modules.kotlin.exception.Exceptions

const val ON_DEVICE_CONNECT_EVENT_NAME = "onDeviceConnect"
const val ON_DEVICE_DISCONNECT_EVENT_NAME = "onDeviceDisconnect"

// TODO: get interface index by claimed interface
const val INTERFACE_INDEX = 0

class ReactNativeUsbModule : Module() {
    // Each module class must implement the definition function. The definition consists of components
    // that describes the module's functionality and behavior.
    // See https://docs.expo.dev/modules/module-api for more details about available components.
    override fun definition() = ModuleDefinition {
        // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
        // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
        // The module will be accessible from `requireNativeModule('ReactNativeUsb')` in JavaScript.
        Name("ReactNativeUsb")

        // Defines event names that the module can send to JavaScript.
        Events(ON_DEVICE_CONNECT_EVENT_NAME, ON_DEVICE_DISCONNECT_EVENT_NAME)

        AsyncFunction("getDevices") {
            return@AsyncFunction getDevices()
        }

        AsyncFunction("open") { deviceName: String ->
            return@AsyncFunction openDevice(deviceName)
        }

        AsyncFunction("close") { deviceName: String ->
            return@AsyncFunction closeDevice(deviceName)
        }

        AsyncFunction("selectConfiguration") { deviceName: String, configurationIndex: Int ->
            return@AsyncFunction selectConfiguration(deviceName, configurationIndex)
        }

        AsyncFunction("claimInterface") { deviceName: String, interfaceNumber: Int ->
            return@AsyncFunction claimInterface(deviceName, interfaceNumber)
        }

        AsyncFunction("releaseInterface") { deviceName: String, interfaceNumber: Int ->
            return@AsyncFunction releaseInterface(deviceName, interfaceNumber)
        }

        AsyncFunction("transferOut") { deviceName: String, endpointNumber: Int, data: String ->
            // TODO: it's recommended to offload this to a separate thread
            return@AsyncFunction transferOut(deviceName, endpointNumber, data)
        }

        AsyncFunction("transferIn") { deviceName: String, endpointNumber: Int, length: Int ->
            // TODO: it's recommended to offload this to a separate thread
            return@AsyncFunction transferIn(deviceName, endpointNumber, length)
        }

        OnCreate {
            val onDeviceConnect: OnDeviceConnect = { device ->
                Log.d("ReactNativeUsbModule", "New connection detected checking permission for device: $device")

                if (usbManager.hasPermission(device)) {
                    // TODO: request permissions only for devices which we are interested, one approach could be to pass list of them from JS during new WebUSB class creation
                    // Or maybe it's not necessary to check due to definition in AndroidManifest.xml ???
                    Log.d("ReactNativeUsbModule", "onDeviceConnected: $device")
                    val webUsbDevice = getWebUSBDevice(device)
                    sendEvent(ON_DEVICE_CONNECT_EVENT_NAME, webUsbDevice)
                    devicesHistory[device.deviceName] = webUsbDevice
                } else {
                    Log.d("ReactNativeUsbModule", "Requesting permission for device: $device")
                    val permissionIntent = PendingIntent.getBroadcast(context, 0, Intent(ACTION_USB_PERMISSION), PendingIntent.FLAG_IMMUTABLE)
                    usbManager.requestPermission(device, permissionIntent)
                }
            }
            val onDeviceDisconnect: OnDeviceDisconnect = { deviceName ->
                Log.d("ReactNativeUsbModule", "onDeviceDisconnected: ${devicesHistory[deviceName]}")

                sendEvent(ON_DEVICE_DISCONNECT_EVENT_NAME, devicesHistory[deviceName])
                Log.d("ReactNativeUsbModule", "Disconnect event sent for device ${devicesHistory[deviceName]}")

                openedConnections.remove(deviceName)
            }
            val onPermissionReceived: OnPermissionReceived = { device ->
                Log.d("ReactNativeUsbModule", "onPermissionReceived: $device")

                val webUsbDevice = getWebUSBDevice(device)
                sendEvent(ON_DEVICE_CONNECT_EVENT_NAME, webUsbDevice)
                devicesHistory[device.deviceName] = webUsbDevice
            }

            ReactNativeUsbAttachedReceiver.setOnDeviceConnectCallback(onDeviceConnect)
            ReactNativeUsbDetachedReceiver.setOnDeviceDisconnectCallback(onDeviceDisconnect)
            ReactNativeUsbPermissionReceiver.setOnPermissionReceivedCallback(onPermissionReceived)

            context.registerReceiver(usbAttachedReceiver, IntentFilter(UsbManager.ACTION_USB_DEVICE_ATTACHED))
            context.registerReceiver(usbDetachedReceiver, IntentFilter(UsbManager.ACTION_USB_DEVICE_DETACHED))
            context.registerReceiver(usbPermissionReceiver, IntentFilter(UsbManager.EXTRA_PERMISSION_GRANTED))
        }

        OnDestroy {
            context.unregisterReceiver(usbAttachedReceiver)
            context.unregisterReceiver(usbDetachedReceiver)
            context.unregisterReceiver(usbPermissionReceiver)

            ReactNativeUsbAttachedReceiver.setOnDeviceConnectCallback(null)
            ReactNativeUsbDetachedReceiver.setOnDeviceDisconnectCallback(null)
            ReactNativeUsbPermissionReceiver.setOnPermissionReceivedCallback(null)

            openedConnections.forEach { (deviceName, _) ->
                closeDevice(deviceName)
            }
        }

    }

    private val usbAttachedReceiver = ReactNativeUsbAttachedReceiver()
    private val usbDetachedReceiver = ReactNativeUsbDetachedReceiver()
    private val usbPermissionReceiver = ReactNativeUsbPermissionReceiver()

    private val context: Context
        get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

    private val usbManager: UsbManager
        get() = context.getSystemService(Context.USB_SERVICE) as UsbManager


    private val openedConnections = mutableMapOf<String, UsbDeviceConnection>()
    // We need to store device metadata because we can't access them in detached event
    private val devicesHistory = mutableMapOf<String, WebUSBDevice>()

    private fun openDevice(deviceName: String): WebUSBDevice {
        Log.d("ReactNativeUsbModule", "Opening device $deviceName")
        val device = getDeviceByName(deviceName)

        val usbConnection = usbManager.openDevice(device)
        if (usbConnection == null) {
            Log.e("ReactNativeUsbModule", "Failed to open device ${device.deviceName}")
            throw Exception("Failed to open device ${device.deviceName}")
        }
        Log.d("ReactNativeUsbModule", "Opening device ${device.deviceName}")
        openedConnections[device.deviceName] = usbConnection

        // log all endpoints for debug purposes
        val usbInterface = device.getInterface(0)
        for (i in 0 until usbInterface.endpointCount) {
            val endpoint = usbInterface.getEndpoint(i)
            Log.d("ReactNativeUsbModule", "endpoint: $endpoint")
        }


        return getWebUSBDevice(device)
    }

    private fun closeDevice(deviceName: String) {
        Log.d("ReactNativeUsbModule", "Closing device $deviceName")
        val usbConnection = getOpenedConnection(deviceName)
        usbConnection.close()
        openedConnections.remove(deviceName)
    }

    private fun selectConfiguration(deviceName: String, configurationIndex: Int) {
        Log.d("ReactNativeUsbModule", "Selecting configuration $configurationIndex for device $deviceName")
        val device = getDeviceByName(deviceName)
        val configurationValue = device.getConfiguration(configurationIndex)
        if (configurationValue == null) {
            Log.e("ReactNativeUsbModule", "Failed to get configuration $configurationIndex for device ${device.deviceName}")
            throw Exception("Failed to get configuration $configurationIndex for device ${device.deviceName}")
        }
        val usbConnection = getOpenedConnection(deviceName)
        usbConnection.setConfiguration(configurationValue)
    }

    private fun claimInterface(deviceName: String, interfaceNumber: Int) {
        Log.d("ReactNativeUsbModule", "Claiming interface $interfaceNumber for device $deviceName")
        val device = getDeviceByName(deviceName)
        val usbConnection = getOpenedConnection(deviceName)
        val usbInterface = device.getInterface(interfaceNumber)
        if (usbInterface == null) {
            Log.e("ReactNativeUsbModule", "Failed to get interface $interfaceNumber for device ${device.deviceName}")
            throw Exception("Failed to get interface $interfaceNumber for device ${device.deviceName}")
        }
        usbConnection.claimInterface(usbInterface, true)
    }

    private fun releaseInterface(deviceName: String, interfaceNumber: Int) {
        Log.d("ReactNativeUsbModule", "Releasing interface $interfaceNumber for device $deviceName")
        val device = getDeviceByName(deviceName)
        val usbConnection = getOpenedConnection(deviceName)
        val usbInterface = device.getInterface(interfaceNumber)
        if (usbInterface == null) {
            Log.e("ReactNativeUsbModule", "Failed to get interface $interfaceNumber for device ${device.deviceName}")
            throw Exception("Failed to get interface $interfaceNumber for device ${device.deviceName}")
        }
        usbConnection.releaseInterface(usbInterface)
    }

    private fun transferOut(deviceName: String, endpointNumber: Int, data: String): Int {
        Log.d("ReactNativeUsbModule", "Transfering data to device $deviceName")
        Log.d("ReactNativeUsbModule", "data: ${data}")
        // split string into array of numbers and then convert numbers to byte array
        val dataByteArray = data.split(",").map { it.toInt().toByte() }.toByteArray()
        Log.d("ReactNativeUsbModule", "dataByteArray: $dataByteArray")
        val device = getDeviceByName(deviceName)
        val usbConnection = getOpenedConnection(deviceName)

        val usbEndpoint = device.getInterface(INTERFACE_INDEX).getEndpoint(1)
        if (usbEndpoint == null) {
            Log.e("ReactNativeUsbModule", "Failed to get endpoint $endpointNumber for device ${device.deviceName}")
            throw Exception("Failed to get endpoint $endpointNumber for device ${device.deviceName}")
        }
        return usbConnection.bulkTransfer(usbEndpoint, dataByteArray, dataByteArray.size, 0)
    }

    private fun transferIn(deviceName: String, endpointNumber: Int, length: Int): IntArray {
        Log.d("ReactNativeUsbModule", "Reading data from device $deviceName")
        val device = getDeviceByName(deviceName)
        val usbConnection = getOpenedConnection(deviceName)

        val usbEndpoint = device.getInterface(INTERFACE_INDEX).getEndpoint(0)

        if (usbEndpoint == null) {
            Log.e("ReactNativeUsbModule", "Failed to get endpoint $endpointNumber for device ${device.deviceName}")
            throw Exception("Failed to get endpoint $endpointNumber for device ${device.deviceName}")
        }

        val buffer = ByteArray(length)
        val result = usbConnection.bulkTransfer(usbEndpoint, buffer, length, 0)
        if (result < 0) {
            Log.e("ReactNativeUsbModule", "Failed to transfer data from device ${device.deviceName}")
            throw Exception("Failed to transfer data from device ${device.deviceName}")
        }
        Log.d("ReactNativeUsbModule", "Read data from device ${device.deviceName}: ${buffer.toList()}")
        // convert buffer to Array
        val bufferArray = buffer.toTypedArray()
        Log.d("ReactNativeUsbModule", "bufferArray: ${bufferArray.toList()}")
        // convert Array to IntArray
        val bufferIntArray = bufferArray.map { it.toInt() }.toIntArray()
        return bufferIntArray
    }

    private fun getOpenedConnection(deviceName: String): UsbDeviceConnection {
        Log.d("ReactNativeUsbModule", "getOpenedConnection: $deviceName")
        return openedConnections[deviceName] ?: throw Exception("Device $deviceName not opened")
    }


    private fun getDeviceByName(deviceName: String): UsbDevice {
        Log.d("ReactNativeUsbModule", "getDeviceByName: $deviceName")
        val devices = usbManager.deviceList.values.toList()
        for (device in devices) {
            if (device.deviceName == deviceName) {
                return device
            }
        }
        throw Exception("Device $deviceName not found")
    }

    private fun getDevices(): List<Map<String, Any?>> {
        Log.d("ReactNativeUsbModule", "getDevices")
        val devices = mutableListOf<WebUSBDevice>()
        var devicesList = usbManager.deviceList.values.toList()
        Log.d("ReactNativeUsbModule", "deviceList: $devicesList")
        for (i in 0 until devicesList.size) {
            val device = devicesList[i]
            if (!usbManager.hasPermission(device)) {
                Log.d("ReactNativeUsbModule", "device: ${device.deviceName} has no permission, skipping")
                continue
            }
            devices.add(getWebUSBDevice(device))
        }
        Log.d("ReactNativeUsbModule", "getDevices: $devices")
        return devices
    }
}

// Convert Android USBDevice to JS compatible WebUSBDevice
typealias WebUSBDevice = Map<String, Any?>

fun getWebUSBDevice(device: UsbDevice): WebUSBDevice {
    return mapOf(
            "deviceName" to device.deviceName,
            //"usbVersionMajor" to device.usbVersionMajor,
            //"usbVersionMinor" to device.usbVersionMinor,
            //"usbVersionSubminor" to device.usbVersionSubminor,
            "deviceClass" to device.deviceClass,
            "deviceSubclass" to device.deviceSubclass,
            "deviceProtocol" to device.deviceProtocol,
            "vendorId" to device.vendorId,
            "productId" to device.productId,
            //"deviceVersionMajor" to device.deviceVersionMajor,
            //"deviceVersionMinor" to device.deviceVersionMinor,
            //"deviceVersionSubminor" to device.deviceVersionSubminor,
            "manufacturerName" to device.manufacturerName,
            "productName" to device.productName,
            "serialNumber" to device.serialNumber,
            //"configuration" to device.configuration,
            //"configurations" to device.configurations,
            "opened" to false,
    )
}
