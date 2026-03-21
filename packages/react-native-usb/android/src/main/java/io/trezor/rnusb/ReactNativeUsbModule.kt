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
import java.util.concurrent.ConcurrentHashMap

// Convert Android USBDevice to JS compatible WebUSBDevice
typealias WebUSBDevice = Map<String, Any?>

const val ACTION_USB_PERMISSION = "io.trezor.rnusb.USB_PERMISSION"
const val ON_DEVICE_CONNECT_EVENT_NAME = "onDeviceConnect"
const val ON_DEVICE_DISCONNECT_EVENT_NAME = "onDeviceDisconnect"
const val LOG_TAG = "ReactNativeUsb"

// TODO: get interface index by claimed interface
const val INTERFACE_INDEX = 0
const val CHUNK_SIZE = 64

// Protocol v1 constants
const val PROTOCOL_V1_MAGIC_BYTE: Byte = 0x3F // '?' character - first byte of v1 messages and chunk header

// Protocol v2 (THP) constants
const val THP_CONTINUATION_PACKET: Byte = 0x80.toByte() // Continuation packet marker for THP
const val THP_HEADER_SIZE = 3 // control_byte + 2 bytes channel

class ReactNativeUsbModule : Module() {
    private val moduleCoroutineScope = CoroutineScope(Dispatchers.IO)
    private var isAppInForeground = false
    // We use priority mode to prevent closing device when app is in background for example during firmware update
    private var isInPriorityMode = false

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

        Function("setPriorityMode") { priorityMode: Boolean ->
            isInPriorityMode = priorityMode
        }

        AsyncFunction("getDevices") {
            return@AsyncFunction getDevices()
        }

        AsyncFunction("open") { deviceName: String ->
            return@AsyncFunction openDevice(deviceName)
        }

        AsyncFunction("reset") { deviceName: String ->
            return@AsyncFunction resetDevice(deviceName)
        }

        AsyncFunction("close") { deviceName: String ->
            return@AsyncFunction closeDevice(deviceName)
        }

        AsyncFunction("claimInterface") { deviceName: String, interfaceNumber: Int ->
            return@AsyncFunction claimInterface(deviceName, interfaceNumber)
        }

        AsyncFunction("releaseInterface") { deviceName: String, interfaceNumber: Int ->
            return@AsyncFunction releaseInterface(deviceName, interfaceNumber)
        }

        AsyncFunction("transferOut") { deviceName: String, endpointNumber: Int, data: ByteArray, promise: Promise ->
            // Clone the data before entering async code, as the original ByteArray from JS
            // may become invalid after switching threads (GC may collect it).
            val dataClone = data.copyOf()

            withModuleScope(promise) {
                try {
                    val result = transferOut(deviceName, endpointNumber, dataClone)
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
            ReactNativeUsbBroadcastReceiver.setOnUsbDeviceAttachedCallback({ device ->
                if (usbManager.hasPermission(device)) {
                    // TODO: request permissions only for devices which we are interested, one approach could be to pass list of them from JS during new WebUSB class creation
                    val webUsbDevice = getWebUSBDevice(device)
                    Log.d(LOG_TAG, "Sending $ON_DEVICE_CONNECT_EVENT_NAME event: ${webUsbDevice}")
                    sendEvent(ON_DEVICE_CONNECT_EVENT_NAME, webUsbDevice)
                    devicesHistory[device.deviceName] = webUsbDevice
                } else if (isAppInForeground) {
                    Log.d(LOG_TAG, "Requesting permission for device: $device")
                    devicesRequestedPermissions.add(device.deviceName)
                    usbManager.requestPermission(device, permissionIntent)
                }
            })
            ReactNativeUsbBroadcastReceiver.setOnUsbDeviceDetachedCallback({ deviceName ->
                Log.d(LOG_TAG, "Removing $deviceName from device history")
                devicesHistory.remove(deviceName)?.let { webUsbDevice ->
                    Log.d(LOG_TAG, "Sending $ON_DEVICE_DISCONNECT_EVENT_NAME event: ${webUsbDevice}")
                    sendEvent(ON_DEVICE_DISCONNECT_EVENT_NAME, webUsbDevice)
                }
                devicesRequestedPermissions.remove(deviceName)
                openedConnections.remove(deviceName)?.close()
            })
        }

        OnActivityEntersForeground {
            isAppInForeground = true

            // We need to check all devices for permission when app enters foreground because it seems as only possible way
            // how to detect if user granted permission for device from dialog.
            // Dialog causes app to go to background, accept or deny permission and then app goes to foreground again.
            val devicesList = usbManager.deviceList.values.toList()
            for (device in devicesList) {
                if (usbManager.hasPermission(device)) {
                    Log.d(LOG_TAG, "Permission granted: $device")

                    val webUsbDevice = if (hasOpenedConnection(device.deviceName)) {
                        Log.d(LOG_TAG, "Device already opened: $device")
                        getWebUSBDevice(device)
                    } else {
                        Log.d(LOG_TAG, "Opening device: $device")
                        openDevice(device.deviceName)
                    }

                    Log.d(LOG_TAG, "Sending $ON_DEVICE_CONNECT_EVENT_NAME event: ${webUsbDevice}")
                    sendEvent(ON_DEVICE_CONNECT_EVENT_NAME, webUsbDevice)
                    devicesHistory[device.deviceName] = webUsbDevice
                } else if (!devicesRequestedPermissions.contains(device.deviceName)) {
                    Log.d(LOG_TAG, "New device connected while app was in background: $device")
                    devicesRequestedPermissions.add(device.deviceName)
                    usbManager.requestPermission(device, permissionIntent)
                } else {
                    Log.d(LOG_TAG, "Permission already requested for device: $device")
                }
            }
        }

        OnActivityEntersBackground {
            if (!isInPriorityMode) {
                isAppInForeground = false
                closeAllOpenedDevices()
            }
        }

        OnDestroy {
            ReactNativeUsbBroadcastReceiver.setOnUsbDeviceAttachedCallback(null)
            ReactNativeUsbBroadcastReceiver.setOnUsbDeviceDetachedCallback(null)

            cancelAllPendingRequests()
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


    private val openedConnections = ConcurrentHashMap<String, UsbDeviceConnection>()
    private val pendingRequests = ConcurrentHashMap<String, UsbRequest>()

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

    private fun resetDevice(deviceName: String) {
        Log.d(LOG_TAG, "Resetting device $deviceName")
        val usbRequest = pendingRequests.remove(deviceName)
        usbRequest?.cancel()
    }

    private fun closeDevice(deviceName: String) {
        Log.d(LOG_TAG, "Closing device $deviceName")
        getOpenedConnection(deviceName).close()
        openedConnections.remove(deviceName)
    }

    private fun closeAllOpenedDevices() {
        Log.d(LOG_TAG, "Closing all devices")

        openedConnections.values.forEach { it.close() }
        openedConnections.clear()
    }

    private fun cancelAllPendingRequests() {
        pendingRequests.values.forEach { it.cancel() }
        pendingRequests.clear()
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

    /**
     * Detects the protocol and returns the appropriate chunk header.
     * - Protocol v1: First byte is 0x3F ('?'), chunk header is 1 byte (0x3F)
     * - Protocol v2 (THP): First byte is a THP control byte, chunk header is 3 bytes (0x80 + channel)
     */
    private fun getChunkHeader(data: ByteArray): ByteArray {
        val firstByte = data[0]

        return if (firstByte == PROTOCOL_V1_MAGIC_BYTE) {
            // Protocol v1: chunk header is just 0x3F
            Log.d(LOG_TAG, "Detected protocol v1, using 1-byte chunk header")
            byteArrayOf(PROTOCOL_V1_MAGIC_BYTE)
        } else {
            // Protocol v2 (THP): chunk header is 0x80 + channel (bytes 1-2)
            // Message format: [control_byte, channel_high, channel_low, ...]
            if (data.size < THP_HEADER_SIZE) {
                Log.w(LOG_TAG, "Data too short for THP header, falling back to v1 header")
                byteArrayOf(PROTOCOL_V1_MAGIC_BYTE)
            } else {
                val channelHigh = data[1]
                val channelLow = data[2]
                Log.d(LOG_TAG, "Detected protocol v2 (THP), using 3-byte chunk header with channel ${channelHigh.toInt() and 0xFF}:${channelLow.toInt() and 0xFF}")
                byteArrayOf(THP_CONTINUATION_PACKET, channelHigh, channelLow)
            }
        }
    }

    /**
     * Creates 64-byte chunks from data for USB transfer.
     *
     * Supports Protocol v1 (1-byte header) and Protocol v2/THP (3-byte header)
     */
    private fun createChunks(data: ByteArray): List<ByteArray> {
        val dataSize = data.size

        // Single chunk case - just pad to CHUNK_SIZE
        if (dataSize <= CHUNK_SIZE) {
            val chunk = ByteArray(CHUNK_SIZE)
            System.arraycopy(data, 0, chunk, 0, dataSize)
            return listOf(chunk)
        }

        // Multi-chunk case - detect protocol and build chunks
        val chunkHeader = getChunkHeader(data)
        val chunkHeaderSize = chunkHeader.size
        val chunkDataSize = CHUNK_SIZE - chunkHeaderSize

        val chunks = mutableListOf<ByteArray>()
        var dataOffset = 0

        // First chunk: no header, up to 64 bytes
        val firstChunk = ByteArray(CHUNK_SIZE)
        System.arraycopy(data, 0, firstChunk, 0, CHUNK_SIZE)
        chunks.add(firstChunk)
        dataOffset = CHUNK_SIZE

        // Subsequent chunks: header + data
        while (dataOffset < dataSize) {
            val chunk = ByteArray(CHUNK_SIZE)
            System.arraycopy(chunkHeader, 0, chunk, 0, chunkHeaderSize)
            val bytesToCopy = minOf(chunkDataSize, dataSize - dataOffset)
            System.arraycopy(data, dataOffset, chunk, chunkHeaderSize, bytesToCopy)
            chunks.add(chunk)
            dataOffset += bytesToCopy
        }

        return chunks
    }

    /**
     * Transfers data to USB device, chunking if necessary.
     * Uses bulkTransfer for efficient sequential transfers.
     */
    private fun transferOut(deviceName: String, endpointNumber: Int, data: ByteArray): Int {
        val transferStartTime = System.nanoTime()

        val device = getDeviceByName(deviceName)
        val usbConnection = openedConnections.getOrPut(device.deviceName) {
            Log.d(LOG_TAG, "transferOut: Reopening device ${device.deviceName}")
            usbManager.openDevice(device) ?: throw Exception("Failed to open device ${device.deviceName}")
        }

        val usbEndpoint = device.getInterface(INTERFACE_INDEX).getEndpoint(1)
        if (usbEndpoint == null) {
            Log.e(LOG_TAG, "Failed to get endpoint $endpointNumber for device ${device.deviceName}")
            throw Exception("Failed to get endpoint $endpointNumber for device ${device.deviceName}")
        }

        val chunks = createChunks(data)
        val totalChunks = chunks.size
        val bulkTimeout = 0 // 0 means no timeout

        for ((index, chunk) in chunks.withIndex()) {
            val bytesWritten = usbConnection.bulkTransfer(usbEndpoint, chunk, CHUNK_SIZE, bulkTimeout)

            if (bytesWritten < 0) {
                Log.e(LOG_TAG, "transferOut: FAILED chunk ${index + 1}/$totalChunks, error: $bytesWritten")
                throw Exception("USB transfer failed for chunk ${index + 1}/$totalChunks, error: $bytesWritten")
            }

            if (bytesWritten != CHUNK_SIZE) {
                Log.e(LOG_TAG, "transferOut: FAILED chunk ${index + 1}/$totalChunks incomplete: $bytesWritten/$CHUNK_SIZE")
                throw Exception("USB transfer incomplete for chunk ${index + 1}/$totalChunks: $bytesWritten/$CHUNK_SIZE bytes")
            }
        }

        val durationMs = (System.nanoTime() - transferStartTime) / 1_000_000.0
        Log.d(LOG_TAG, "transferOut: Done - ${data.size} bytes, $totalChunks chunks, %.1f ms".format(durationMs))

        return data.size
    }

    private fun transferIn(deviceName: String, endpointNumber: Int, length: Int): ByteArray {
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

        if (pendingRequests.putIfAbsent(device.deviceName, req) != null) {
            req.cancel()
            req.close()
            Log.e(LOG_TAG, "Transfer already in progress for device ${device.deviceName}")
            throw Exception("Transfer already in progress for device ${device.deviceName}")
        }

        val result = try {
            usbConnection.requestWait()
        } finally {
            pendingRequests.remove(device.deviceName)
            req.close()
        }

        if (result == null) {
            Log.e(LOG_TAG, "Failed to transfer data from device ${device.deviceName}")
            throw Exception("Failed to transfer data from device ${device.deviceName}")
        }

        Log.d(LOG_TAG, "Read data from device ${device.deviceName}: $length bytes")
        return buffer.array()
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
