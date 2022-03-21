package io.trezor.transport.bridges;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.hardware.usb.UsbConstants;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;
import android.hardware.usb.UsbManager;
import android.hardware.usb.UsbRequest;
import android.util.Log;

import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

import io.trezor.transport.TrezorException;
import io.trezor.transport.Utils;
import io.trezor.transport.interfaces.BridgeInterface;
import io.trezor.transport.interfaces.TrezorInterface;
import io.trezor.transport.receivers.USBPermissionReceiver;

public class USBBridge implements BridgeInterface {
  private static final String TAG = "Trezor USBBridge";
  private static USBBridge instance;

  private final Context context;
  private final UsbManager usbManager;

  private List<TrezorInterface> trezorDeviceList;

  private USBBridge(Context context) {
    this.context = context.getApplicationContext();
    this.usbManager = (UsbManager) context.getSystemService(Context.USB_SERVICE);
  }

  public static USBBridge getInstance(Context context) {
    if (instance == null) {
      instance = new USBBridge(context);
    }
    return instance;
  }

  @Override
  public List<TrezorInterface> enumerate() {
    // We only check the usbManager device list if we don't already have it
    // otherwise we trust attached/detached receivers to do their job
    if (trezorDeviceList == null) {
      HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
      trezorDeviceList = new ArrayList();
      for (final UsbDevice usbDevice : deviceList.values()) {
        // check if the device is Trezor
        Log.d(TAG, usbDevice.toString());
        if (!Utils.deviceIsTrezor(usbDevice))
          continue;
        if (usbManager.hasPermission(usbDevice)) {
          trezorDeviceList.add(new TrezorDevice(usbDevice));
        }
      }
    }

    return trezorDeviceList;
  }

  @Override
  public void findAlreadyConnectedDevices() {
    HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
    Log.d(TAG, "Adding already connected devices " + deviceList.values().toString());
    for (UsbDevice device : deviceList.values()) {
      Log.d(TAG, "Trying to add device" + device.toString());
      addDevice(device);
    }
  }

  public void addDevice(UsbDevice device) {
    Log.d(TAG, "Trying to add USB device");
    if (usbManager.hasPermission(device)) {
      addDeviceToList(new TrezorDevice(device));
      Log.d(TAG, "Device added");
    } else {
      Log.d(TAG, "No permission, requesting permissions for device...");
      PendingIntent pi = PendingIntent.getBroadcast(context.getApplicationContext(), 0, new Intent(USBPermissionReceiver.USB_PERMISSION_GRANTED).setClass(context.getApplicationContext(), USBPermissionReceiver.class), PendingIntent.FLAG_IMMUTABLE);
      usbManager.requestPermission(device, pi);
    }
  }

  @Override
  public TrezorInterface getDeviceByPath(String serialNumber) { // TODO: throw exxception?
    if (trezorDeviceList != null) {
      for (TrezorInterface trezorDevice : trezorDeviceList) {
        if (trezorDevice.getSerial().equalsIgnoreCase(serialNumber)) {
          return trezorDevice;
        }
      }
    } else {
      return null;
    }
    return null;
  }

  // Should be called from device attached receiver
  public void addDeviceToList(TrezorDevice device) {
    if (trezorDeviceList != null) {
      if (getDeviceByPath(device.serial) == null) {
        trezorDeviceList.add(device);
      } else {
        Log.d(TAG, String.format("device %s already in trezorDeviceList", device.getSerial()));
      }
    } else {
      trezorDeviceList = new ArrayList();
      trezorDeviceList.add(device);
    }
  }

  // should be called from device detached receiver
  public void removeDeviceFromList(TrezorInterface device) {
    if (trezorDeviceList != null) {
      if (trezorDeviceList.contains(device)) {
        trezorDeviceList.remove(device);
      } else {
        Log.d(TAG, String.format("device %s not found in trezorDeviceList", device.getSerial()));
      }
    }
  }

  public void removeAllDevices() {
    trezorDeviceList = null;
  }

  //
  // INNER CLASSES
  //

  public static class TrezorDevice implements TrezorInterface {
    private static final String TAG = "USB" + TrezorDevice.class.getSimpleName();

    private final String deviceName;
    private final String serial;
    private final UsbDevice usbDevice;

    // next fields are only valid until calling close()
    private UsbDeviceConnection usbConnection;
    private UsbInterface usbInterface;
    private UsbEndpoint readEndpoint;
    private UsbEndpoint writeEndpoint;

    public TrezorDevice(UsbDevice usbDevice) {
      this.deviceName = usbDevice.getDeviceName();
      this.serial = usbDevice.getSerialNumber();

      this.usbConnection = null;
      this.usbInterface = null;
      this.readEndpoint = null;
      this.writeEndpoint = null;
      this.usbDevice = usbDevice;
    }

    @Override
    public void rawPost(byte[] raw) {
      if (usbConnection == null)
        throw new TrezorException(TAG + ": sendMessage: usbConnection already closed, cannot send message");

      ByteBuffer data = ByteBuffer.allocate(raw.length + 1024); // 32768);
      data.put(raw);

      while (data.position() % 63 > 0) {
        data.put((byte) 0);
      }
      UsbRequest request = new UsbRequest();
      request.initialize(usbConnection, writeEndpoint);
      int chunks = data.position() / 63;
      Log.i(TAG, String.format("messageWrite: Writing %d chunks", chunks));
      data.rewind();
      for (int i = 0; i < chunks; i++) {
        byte[] buffer = new byte[64];
        buffer[0] = (byte) '?';
        data.get(buffer, 1, 63);
        request.queue(ByteBuffer.wrap(buffer), 64);
        usbConnection.requestWait();
      }
      Log.i(TAG, "Writing done");
    }

    @Override
    public byte[] rawRead() {
      ByteBuffer data = null;// ByteBuffer.allocate(32768);
      ByteBuffer buffer = ByteBuffer.allocate(64);
      UsbRequest request = new UsbRequest();
      request.initialize(usbConnection, readEndpoint);
      int msg_size;
      int invalidChunksCounter = 0;

      // read first 64bytes
      for (; ; ) {
        request.queue(buffer, 64);
        usbConnection.requestWait();
        byte[] b = buffer.array();
        Log.i(TAG, String.format("messageRead: Read chunk: %d bytes", b.length));

        if (b.length < 9 || b[0] != (byte) '?' || b[1] != (byte) '#' || b[2] != (byte) '#') {
          if (invalidChunksCounter++ > 5) {
            Log.e(TAG, "THROW EXCEPTION");
            throw new TrezorException("too many invalid chunks");
          }
          continue;
        }
        if (b[0] != (byte) '?' || b[1] != (byte) '#' || b[2] != (byte) '#')
          continue;

        msg_size = (((int) b[5] & 0xFF) << 24)
          + (((int) b[6] & 0xFF) << 16)
          + (((int) b[7] & 0xFF) << 8)
          + ((int) b[8] & 0xFF);

        data = ByteBuffer.allocate(msg_size + 1024);
        data.put(b, 1, b.length - 1);
        break;
      }

      invalidChunksCounter = 0;

      // read the rest of the data
      while (data.position() < msg_size) {
        request.queue(buffer, 64);
        usbConnection.requestWait();
        byte[] b = buffer.array();
        Log.i(TAG, String.format("messageRead: Read chunk (cont): %d bytes", b.length));
        if (b[0] != (byte) '?') {
          if (invalidChunksCounter++ > 5) {
            Log.e(TAG, "THROW EXCEPTION");
            throw new TrezorException("too many invalid chunks");
          }
          continue;
        }

        data.put(b, 1, b.length - 1);
      }
      int paddedLength = Utils.calculatePaddedLength(msg_size, 63);
      Log.d(TAG, String.format("data size %d value %s", paddedLength, Utils.byteArrayToHexString(data.array())));

      return Arrays.copyOfRange(data.array(), 0, paddedLength);
    }

    @Override
    public void openConnection(Context context) throws TrezorException {
      UsbManager usbManager = (UsbManager) context.getSystemService(Context.USB_SERVICE);

      // use first interface
      usbInterface = usbDevice.getInterface(0);
      // try to find read/write endpoints
      readEndpoint = null;
      writeEndpoint = null;
      for (int i = 0; i < usbInterface.getEndpointCount(); i++) {
        UsbEndpoint ep = usbInterface.getEndpoint(i);
        if (readEndpoint == null && ep.getType() == UsbConstants.USB_ENDPOINT_XFER_INT && ep.getAddress() == 0x81) {
          // number=1; dir=USB_DIR_IN
          readEndpoint = ep;
          continue;
        }
        if (writeEndpoint == null && ep.getType() == UsbConstants.USB_ENDPOINT_XFER_INT
          && (ep.getAddress() == 0x01 || ep.getAddress() == 0x02)) { // number = 1 ; dir = USB_DIR_OUT
          writeEndpoint = ep;
        }
      }

      // TODO: error states
      if (readEndpoint == null) {
        throw new TrezorException("Could not find read endpoint");
      }
      if (writeEndpoint == null) {
        throw new TrezorException("Could not find write endpoint");
      }
      if (readEndpoint.getMaxPacketSize() != 64) {
        throw new TrezorException("Wrong packet size for read endpoint");
      }
      if (writeEndpoint.getMaxPacketSize() != 64) {
        throw new TrezorException("Wrong packet size for write endpoint");
      }

      Log.d(TAG, "opening connection");
      usbConnection = usbManager.openDevice(usbDevice);
      if (usbConnection == null) {
        throw new TrezorException("Could not open connection");
      } else {
        if (usbConnection.claimInterface(usbInterface, true)) {
          Log.d(TAG, "Connection should be open now");
        } else {
          throw new TrezorException("Could not claim interface");
        }
      }
    }

    @Override
    public void closeConnection() {
      if (this.usbConnection != null) {
        try {
          usbConnection.releaseInterface(usbInterface);
        } catch (Exception ex) {
        }
        try {
          usbConnection.close();
        } catch (Exception ex) {
        }

        usbConnection = null;
        usbInterface = null;
        readEndpoint = null;
        writeEndpoint = null;
      }
    }

    @Override
    public String toString() { // TODO: remove this?
      return "{\"path\":\"" + this.serial + "\",\"session\": null}";
    }

    @Override
    public String getSerial() {
      return this.serial;
    }
  }
}
