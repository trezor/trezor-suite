package io.trezor.rnusb

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

import android.content.Context
import android.content.Intent
import android.app.PendingIntent
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

// Convert Android USBDevice to JS compatible WebUSBDevice
typealias WebUSBDevice = Map<String, Any?>

const val ACTION_USB_PERMISSION = "io.trezor.rnusb.USB_PERMISSION"
const val ON_DEVICE_CONNECT_EVENT_NAME = "onDeviceConnect"
const val ON_DEVICE_DISCONNECT_EVENT_NAME = "onDeviceDisconnect"
const val LOG_TAG = "ReactNativeUsb"

// TODO: get interface index by claimed interface
const val INTERFACE_INDEX = 0

class ReactNativeUsbModule : Module() {
    private val moduleCoroutineScope = CoroutineScope(Dispatchers.IO)
    private var isAppInForeground = false

    // List of devices for which permission has already been requested to prevent redundant requests if the user denies permission.
    private var devicesRequestedPermissions = mutableListOf<String>()

    private val permissionIntent by lazy {
        val intent = Intent(context, ReactNativeUsbPermissionReceiver::class.java)
        intent.setAction(ACTION_USB_PERMISSION)
        PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_MUTABLE)
    }

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
                    Log.e(LOG_TAG, "Failed to transfer data to device $deviceName")
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
                    Log.e(LOG_TAG, "Failed to transfer data from device $deviceName")
                }
            }
        }

        OnCreate {
            val onDeviceConnect: OnDeviceConnect = { device ->
                Log.d(LOG_TAG, "New connection detected checking permission for device: $device")

                if (usbManager.hasPermission(device)) {
                    // TODO: request permissions only for devices which we are interested, one approach could be to pass list of them from JS during new WebUSB class creation
                    Log.d(LOG_TAG, "onDeviceConnected: $device")
                    val webUsbDevice = getWebUSBDevice(device)
                    sendEvent(ON_DEVICE_CONNECT_EVENT_NAME, webUsbDevice)
                    devicesHistory[device.deviceName] = webUsbDevice
                } else if (isAppInForeground) {
                    Log.d(LOG_TAG, "Request permission for device: $device")
                    devicesRequestedPermissions.add(device.deviceName)

                    usbManager.requestPermission(device, permissionIntent)
                }
            }
            val onDeviceDisconnect: OnDeviceDisconnect = { deviceName ->
                Log.d(LOG_TAG, "onDeviceDisconnected: ${devicesHistory[deviceName]}")

                if (devicesHistory[deviceName] == null) {
                    Log.e(LOG_TAG, "Device $deviceName not found in history.")
                }

                devicesHistory[deviceName]?.let { sendEvent(ON_DEVICE_DISCONNECT_EVENT_NAME, it) }
                Log.d(LOG_TAG, "Disconnect event sent for device ${devicesHistory[deviceName]}")

                devicesRequestedPermissions.remove(deviceName)
                openedConnections.remove(deviceName)
            }

            ReactNativeUsbAttachedReceiver.setOnDeviceConnectCallback(onDeviceConnect)
            ReactNativeUsbDetachedReceiver.setOnDeviceDisconnectCallback(onDeviceDisconnect)
        }

        OnActivityEntersForeground {
            isAppInForeground = true

            // We need to check all devices for permission when app enters foreground because it seems as only possible way
            // how to detect if user granted permission for device from dialog.
            // Dialog causes app to go to background, accept or deny permission and then app goes to foreground again.
            val devicesList = usbManager.deviceList.values.toList()
            for (device in devicesList) {
                if (usbManager.hasPermission(device)) {
                    Log.d(LOG_TAG, "Has permission, send event onDeviceConnected: $device")
                    
                    val webUsbDevice = if (hasOpenedConnection(device.deviceName)) {
                        Log.d(LOG_TAG, "Device already opened: $device")
                        getWebUSBDevice(device)
                    } else {
                        Log.d(LOG_TAG, "Opening device: $device")
                        openDevice(device.deviceName)
                    }

                    sendEvent(ON_DEVICE_CONNECT_EVENT_NAME, webUsbDevice)
                    devicesHistory[device.deviceName] = webUsbDevice
                } else if (!devicesRequestedPermissions.contains(
                        device.deviceName
                    )
                ) {
                    Log.d(LOG_TAG, "New device connected while app was in background: $device")
                    devicesRequestedPermissions.add(device.deviceName)
                    usbManager.requestPermission(device, permissionIntent)
                } else {
                    Log.d(LOG_TAG, "Permission already requested for device: $device")
                }
            }
        }

        OnActivityEntersBackground {
            isAppInForeground = false
            closeAllOpenedDevices()
        }

        OnDestroy {
            ReactNativeUsbAttachedReceiver.setOnDeviceConnectCallback(null)
            ReactNativeUsbDetachedReceiver.setOnDeviceDisconnectCallback(null)

            closeAllOpenedDevices()

            try {
                moduleCoroutineScope.cancel(ModuleDestroyedException())
            } catch (e: IllegalStateException) {
                Log.e(LOG_TAG, "The scope does not have a job in it")
            }
        }

    }

    private inline fun withModuleScope(promise: Promise, crossinline block: () -> Unit) =
        moduleCoroutineScope.launch {
            try {
                block()
            } catch (e: CodedException) {
                promise.reject(e)
            } catch (e: ModuleDestroyedException) {
                promise.reject(LOG_TAG, "React Native USB module destroyed", e)
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
        Log.d(LOG_TAG, "Opening device $deviceName")
        val device = getDeviceByName(deviceName)

        val usbConnection = usbManager.openDevice(device)
        if (usbConnection == null) {
            Log.e(LOG_TAG, "Failed to open device ${device.deviceName}")
            throw Exception("Failed to open device ${device.deviceName}")
        }

        openedConnections[device.deviceName] = usbConnection

        // log all endpoints for debug purposes
        val usbInterface = device.getInterface(0)
        for (i in 0 until usbInterface.endpointCount) {
            val endpoint = usbInterface.getEndpoint(i)
            Log.d(LOG_TAG, "endpoint: $endpoint")
        }


        return getWebUSBDevice(device)
    }

    private fun closeDevice(deviceName: String) {
        Log.d(LOG_TAG, "Closing device $deviceName")
        getOpenedConnection(deviceName).close()
        openedConnections.remove(deviceName)
    }

    private fun closeAllOpenedDevices() {
        Log.d(LOG_TAG, "Closing all devices")
        with(openedConnections.iterator()) {
            forEach {
                it.value.close()
                remove()
            }
        }
    }

    private fun selectConfiguration(deviceName: String, configurationIndex: Int) {
        Log.d(LOG_TAG, "Selecting configuration $configurationIndex for device $deviceName")
        val device = getDeviceByName(deviceName)
        val configurationValue = device.getConfiguration(configurationIndex)
        if (configurationValue == null) {
            Log.e(
                LOG_TAG,
                "Failed to get configuration $configurationIndex for device ${device.deviceName}"
            )
            throw Exception("Failed to get configuration $configurationIndex for device ${device.deviceName}")
        }
        val usbConnection = getOpenedConnection(deviceName)
        usbConnection.setConfiguration(configurationValue)
    }

    private fun claimInterface(deviceName: String, interfaceNumber: Int) {
        Log.d(LOG_TAG, "Claiming interface $interfaceNumber for device $deviceName")
        val device = getDeviceByName(deviceName)
        val usbConnection = getOpenedConnection(deviceName)
        val usbInterface = device.getInterface(interfaceNumber)
        if (usbInterface == null) {
            Log.e(
                LOG_TAG,
                "Failed to get interface $interfaceNumber for device ${device.deviceName}"
            )
            throw Exception("Failed to get interface $interfaceNumber for device ${device.deviceName}")
        }
        usbConnection.claimInterface(usbInterface, true)
    }

    private fun releaseInterface(deviceName: String, interfaceNumber: Int) {
        Log.d(LOG_TAG, "Releasing interface $interfaceNumber for device $deviceName")
        val device = getDeviceByName(deviceName)
        val usbConnection = getOpenedConnection(deviceName)
        val usbInterface = device.getInterface(interfaceNumber)
        if (usbInterface == null) {
            Log.e(
                LOG_TAG,
                "Failed to get interface $interfaceNumber for device ${device.deviceName}"
            )
            throw Exception("Failed to get interface $interfaceNumber for device ${device.deviceName}")
        }
        usbConnection.releaseInterface(usbInterface)
    }

    private fun transferOut(deviceName: String, endpointNumber: Int, data: String): Int {
        Log.d(LOG_TAG, "Transfering data to device $deviceName")
        Log.d(LOG_TAG, "data: $data")
        // split string into array of numbers and then convert numbers to byte array
        val dataByteArray = data.split(",").map { it.toInt().toByte() }.toByteArray()
        Log.d(LOG_TAG, "dataByteArray: $dataByteArray")
        val device = getDeviceByName(deviceName)
        val usbConnection = openedConnections.getOrPut(device.deviceName) {
            Log.d(LOG_TAG, "Reopening device ${device.deviceName}")
            usbManager.openDevice(device) ?: throw Exception("Failed to open device ${device.deviceName}")
        }

        val usbEndpoint = device.getInterface(INTERFACE_INDEX).getEndpoint(1)
        if (usbEndpoint == null) {
            Log.e(LOG_TAG, "Failed to get endpoint $endpointNumber for device ${device.deviceName}")
            throw Exception("Failed to get endpoint $endpointNumber for device ${device.deviceName}")
        }
        val result = usbConnection.bulkTransfer(usbEndpoint, dataByteArray, dataByteArray.size, 0)
        Log.d(LOG_TAG, "Transfered data to device ${device.deviceName}: $result")
        return result
    }

    private fun transferIn(deviceName: String, endpointNumber: Int, length: Int): IntArray {
        Log.d(LOG_TAG, "Reading data from device $deviceName")
        val device = getDeviceByName(deviceName)

        val usbConnection = openedConnections.getOrPut(device.deviceName) {
            Log.d(LOG_TAG, "Reopening device ${device.deviceName}")
            usbManager.openDevice(device) ?: throw Exception("Failed to open device ${device.deviceName}")
        }

        val usbEndpoint = device.getInterface(INTERFACE_INDEX).getEndpoint(0)

        if (usbEndpoint == null) {
            Log.e(LOG_TAG, "Failed to get endpoint $endpointNumber for device ${device.deviceName}")
            throw Exception("Failed to get endpoint $endpointNumber for device ${device.deviceName}")
        }

        val buffer = ByteBuffer.allocate(length)
        val req = UsbRequest()
        req.initialize(usbConnection, usbEndpoint)
        req.queue(buffer)

        val result = usbConnection.requestWait()

        if (result == null) {
            Log.e(LOG_TAG, "Failed to transfer data from device ${device.deviceName}")
            throw Exception("Failed to transfer data from device ${device.deviceName}")
        }
        Log.d(LOG_TAG, "Read data from device ${device.deviceName}: ${buffer.array()}")
        // convert buffer to Array
        val bufferArray = buffer.array()
        Log.d(LOG_TAG, "bufferArray: ${bufferArray.toList()}")
        // convert Array to IntArray
        val bufferIntArray = bufferArray.map { it.toInt() }.toIntArray()
        return bufferIntArray
    }

    private fun getOpenedConnection(deviceName: String): UsbDeviceConnection {
        Log.d(LOG_TAG, "getOpenedConnection: $deviceName")
        return openedConnections[deviceName] ?: throw Exception("Device $deviceName not opened")
    }

    private fun hasOpenedConnection(deviceName: String): Boolean {
        val isConnectionOpened = openedConnections.containsKey(deviceName)
        Log.d(LOG_TAG, "Device $deviceName hasOpenedConnection: $isConnectionOpened")
        return isConnectionOpened
    }


    private fun getDeviceByName(deviceName: String): UsbDevice {
        Log.d(LOG_TAG, "getDeviceByName: $deviceName")
        val devices = usbManager.deviceList.values.toList()
        for (device in devices) {
            if (device.deviceName == deviceName) {
                return device
            }
        }
        throw Exception("Device $deviceName not found")
    }

    private fun getDevices(): List<Map<String, Any?>> {
        Log.d(LOG_TAG, "getDevices")
        val devices = mutableListOf<WebUSBDevice>()
        val devicesList = usbManager.deviceList.values.toList()
        Log.d(LOG_TAG, "deviceList: $devicesList")
        for (i in 0 until devicesList.size) {
            val device = devicesList[i]
            if (!usbManager.hasPermission(device)) {
                Log.d(LOG_TAG, "device: ${device.deviceName} has no permission, skipping")
                continue
            }
            val webUsbDevice = getWebUSBDevice(device)
            devices.add(webUsbDevice)
            devicesHistory[device.deviceName] = webUsbDevice
        }
        Log.d(LOG_TAG, "getDevices: $devices")
        return devices
    }

    private fun getWebUSBDevice(device: UsbDevice): WebUSBDevice {
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
            "opened" to hasOpenedConnection(device.deviceName),
        )
    }
}
