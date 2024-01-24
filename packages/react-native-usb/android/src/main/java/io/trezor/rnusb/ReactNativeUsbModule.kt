package io.trezor.rnusb

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

import android.content.Context
import android.content.IntentFilter
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbDeviceConnection
import android.hardware.usb.UsbManager
import android.hardware.usb.UsbRequest
import android.util.Log
import expo.modules.kotlin.exception.Exceptions
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.core.errors.ModuleDestroyedException
import java.nio.ByteBuffer


const val ON_DEVICE_CONNECT_EVENT_NAME = "onDeviceConnect"
const val ON_DEVICE_DISCONNECT_EVENT_NAME = "onDeviceDisconnect"

// TODO: get interface index by claimed interface
const val INTERFACE_INDEX = 0

class ReactNativeUsbModule : Module() {
    private val moduleCoroutineScope = CoroutineScope(Dispatchers.IO)

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

        AsyncFunction("transferOut") { deviceName: String, endpointNumber: Int, data: String, promise: Promise ->
            withModuleScope(promise) {
                try {
                    val result = transferOut(deviceName, endpointNumber, data)
                    promise.resolve(result)
                } catch (e: Exception) {
                    promise.reject("USB Write Error", e.message, e)
                    Log.e("ReactNativeUsbModule", "Failed to transfer data to device $deviceName")
                }
            }
        }

        AsyncFunction("transferIn") { deviceName: String, endpointNumber: Int, length: Int, promise: Promise ->
            withModuleScope(promise) {
                try {
                    val result = transferIn(deviceName, endpointNumber, length)
                    promise.resolve(result)
                } catch (e: Exception) {
                    promise.reject("USB Read Error", e.message, e)
                    Log.e("ReactNativeUsbModule", "Failed to transfer data from device $deviceName")
                }
            }
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
                    Log.d("ReactNativeUsbModule", "No permission for connected device: $device")
                }
            }
            val onDeviceDisconnect: OnDeviceDisconnect = { deviceName ->
                Log.d("ReactNativeUsbModule", "onDeviceDisconnected: ${devicesHistory[deviceName]}")

                if (devicesHistory[deviceName] == null) {
                    Log.e("ReactNativeUsbModule", "Device $deviceName not found in history.")
                }

                devicesHistory[deviceName]?.let { sendEvent(ON_DEVICE_DISCONNECT_EVENT_NAME, it) }
                Log.d("ReactNativeUsbModule", "Disconnect event sent for device ${devicesHistory[deviceName]}")

                openedConnections.remove(deviceName)
            }

            ReactNativeUsbAttachedReceiver.setOnDeviceConnectCallback(onDeviceConnect)
            ReactNativeUsbDetachedReceiver.setOnDeviceDisconnectCallback(onDeviceDisconnect)

            context.registerReceiver(usbAttachedReceiver, IntentFilter(UsbManager.ACTION_USB_DEVICE_ATTACHED))
            context.registerReceiver(usbDetachedReceiver, IntentFilter(UsbManager.ACTION_USB_DEVICE_DETACHED))
        }

        OnActivityEntersForeground {
            // We need to check all devices for permission when app enters foreground because it seems as only possible way
            // how to detect if user granted permission for device from dialog.
            // Dialog causes app to go to background, accept or deny permission and then app goes to foreground again.
            val devicesList = usbManager.deviceList.values.toList()
            for (device in devicesList) {
                if (usbManager.hasPermission(device)) {
                    Log.d("ReactNativeUsbModule", "Has permission, send event onDeviceConnected: $device")
                    val webUsbDevice = getWebUSBDevice(device)
                    sendEvent(ON_DEVICE_CONNECT_EVENT_NAME, webUsbDevice)
                    devicesHistory[device.deviceName] = webUsbDevice
                } else {
                    Log.d("ReactNativeUsbModule", "No permission for device: $device")
                }
            }
        }

        OnDestroy {
            context.unregisterReceiver(usbAttachedReceiver)
            context.unregisterReceiver(usbDetachedReceiver)

            ReactNativeUsbAttachedReceiver.setOnDeviceConnectCallback(null)
            ReactNativeUsbDetachedReceiver.setOnDeviceDisconnectCallback(null)

            openedConnections.forEach { (deviceName, _) ->
                closeDevice(deviceName)
            }

            try {
                moduleCoroutineScope.cancel(ModuleDestroyedException())
            } catch (e: IllegalStateException) {
                Log.e("ReactNativeUsbModule", "The scope does not have a job in it")
            }
        }

    }

    private val usbAttachedReceiver = ReactNativeUsbAttachedReceiver()
    private val usbDetachedReceiver = ReactNativeUsbDetachedReceiver()


    private inline fun withModuleScope(promise: Promise, crossinline block: () -> Unit) = moduleCoroutineScope.launch {
        try {
            block()
        } catch (e: CodedException) {
            promise.reject(e)
        } catch (e: ModuleDestroyedException) {
            promise.reject("ReactNativeUsbModule", "React Native USB module destroyed", e)
        }
    }
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
        val result = usbConnection.bulkTransfer(usbEndpoint, dataByteArray, dataByteArray.size, 0)
        Log.d("ReactNativeUsbModule", "Transfered data to device ${device.deviceName}: $result")
        return result
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

        val buffer = ByteBuffer.allocate(length)
        val req = UsbRequest()
        req.initialize(usbConnection, usbEndpoint)
        req.queue(buffer)

        val result = usbConnection.requestWait()

        if (result == null) {
            Log.e("ReactNativeUsbModule", "Failed to transfer data from device ${device.deviceName}")
            throw Exception("Failed to transfer data from device ${device.deviceName}")
        }
        Log.d("ReactNativeUsbModule", "Read data from device ${device.deviceName}: ${buffer.array()}")
        // convert buffer to Array
        val bufferArray = buffer.array()
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
            val webUsbDevice = getWebUSBDevice(device)
            devices.add(webUsbDevice)
            devicesHistory[device.deviceName] = webUsbDevice
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
