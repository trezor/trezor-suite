package io.trezor.transport.bridges;

import android.content.Context;
import android.util.Log;

import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.SocketException;
import java.net.UnknownHostException;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import io.trezor.transport.TrezorException;
import io.trezor.transport.Utils;
import io.trezor.transport.interfaces.BridgeInterface;
import io.trezor.transport.interfaces.TrezorInterface;

public class UDPBridge implements BridgeInterface {
  private static final String TAG = "Trezor UDPBridge";
  private static final String EMULATOR_UDP_HOST = "10.0.2.2";
  private static final int EMULATOR_UDP_PORT = 21324;
  private final byte[] PING = "PINGPING".getBytes();
  private final String PONG = "PONGPONG";
  private static UDPBridge instance;

  private final Context context;

  private List<TrezorInterface> trezorDeviceList = new ArrayList<>();

  public UDPBridge(Context context) {
    this.context = context;
  }

  public static UDPBridge getInstance(Context context) {
    if (instance == null) {
      instance = new UDPBridge(context);
    }
    return instance;
  }

  @Override
  public List<TrezorInterface> enumerate() {
    if (!checkDevice()) {
      trezorDeviceList = new ArrayList<>();
    } else if (trezorDeviceList.size() == 0) {
      trezorDeviceList.add(new TrezorDevice("udp-emulator"));
    }

    return trezorDeviceList;
  }

  @Override
  public TrezorInterface getDeviceByPath(String path) {
    if (trezorDeviceList.size() > 0) {
      return trezorDeviceList.get(0);
    } else {
      return enumerate().get(0);
    }
  }

  @Override
  public void findAlreadyConnectedDevices() {
  }

  DatagramSocket socket;
  InetAddress socketAddress;

  private boolean checkDevice() {
    try {
      socketAddress = InetAddress.getByName(EMULATOR_UDP_HOST);
      if (socket == null) {
        socket = new DatagramSocket();
        socket.setSoTimeout(500);
      }

      DatagramPacket pingPacket = new DatagramPacket(PING, PING.length, socketAddress, EMULATOR_UDP_PORT);
      socket.send(pingPacket);

      byte[] pong = new byte[8];
      DatagramPacket pongPacket = new DatagramPacket(pong, pong.length, socketAddress, EMULATOR_UDP_PORT);
      socket.receive(pongPacket);

      return new String(pong).equals(PONG);
    } catch (IOException e) {
      // e.printStackTrace();
      return false;
    }
  }

  public static class TrezorDevice implements TrezorInterface {
    private static final String TAG = "UDP" + UDPBridge.TrezorDevice.class.getSimpleName();

    private final String path;
    private DatagramSocket socket;
    private InetAddress socketAddress;
    private byte[] response;

    public TrezorDevice(String path) {
      this.path = path;
    }

    @Override
    public void rawPost(byte[] raw) {
      try {
        DatagramPacket datagramPacketOut;
        ByteBuffer data = ByteBuffer.allocate(raw.length + 1024); // 32768);
        data.put(raw);
        while (data.position() % 63 > 0) {
          data.put((byte) 0);
        }
        int chunks = data.position() / 63;
        Log.i(TAG, String.format("messageWrite: Writing %d chunks", chunks));
        data.rewind();

        for (int i = 0; i < chunks; i++) {
          byte[] buffer = new byte[64];
          buffer[0] = (byte) '?';
          data.get(buffer, 1, 63);
          datagramPacketOut = new DatagramPacket(buffer, buffer.length, socketAddress, EMULATOR_UDP_PORT);
          socket.send(datagramPacketOut);
        }

      } catch (IOException e) {
        Log.d(TAG, e.getMessage());
        e.printStackTrace();
      }

      response = null;
      try {
        response = rawRead1();
      } catch (Exception e) {
        Log.d(TAG, e.getMessage());
        e.printStackTrace();
      }
    }

    @Override
    public byte[] rawRead() {
      return response;
    }

    public byte[] rawRead1() {
      ByteBuffer data = null;//ByteBuffer.allocate(32768);
      byte[] b = new byte[64];
      DatagramPacket datagramPacketIn;
      int msg_size;
      int invalidChunksCounter = 0;

      // read first 64bytes
      for (; ; ) {
        datagramPacketIn = new DatagramPacket(b, 0, 64, socketAddress, EMULATOR_UDP_PORT);
        try {
          socket.receive(datagramPacketIn);
        } catch (IOException e) {
          Log.e(TAG, "messageRead: read from socket failed");
          e.printStackTrace();
          throw new TrezorException("Socket IOException", e);
        }
        Log.i(TAG, String.format("messageRead: Read chunk: %d bytes", b.length));

        if (b.length < 9 || b[0] != (byte) '?' || b[1] != (byte) '#' || b[2] != (byte) '#') {
          if (invalidChunksCounter++ > 5)
            Log.e(TAG, "THROW EXCEPTION");
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
        datagramPacketIn = new DatagramPacket(b, 0, 64, socketAddress, EMULATOR_UDP_PORT);
        try {
          socket.receive(datagramPacketIn);
        } catch (IOException e) {
          e.printStackTrace();
          throw new TrezorException("Socket IOException", e);
        }
        Log.i(TAG, String.format("messageRead: Read chunk (cont): %d bytes", b.length));
        if (b[0] != (byte) '?') {
          if (invalidChunksCounter++ > 5)
            Log.e(TAG, "THROW EXCEPTION");
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
      try {
        socketAddress = InetAddress.getByName(EMULATOR_UDP_HOST);
        if (socket == null) {
          socket = new DatagramSocket();
        }
      } catch (SocketException e) {
        e.printStackTrace();
        throw new TrezorException("Socket exception", e);
      } catch (UnknownHostException e) {
        e.printStackTrace();
        throw new TrezorException("Unknown exception", e);
      }
    }

    @Override
    public void closeConnection() {
      socket.close();
      socket = null;
    }

    @Override
    public String toString() {
      return "{\"path\":\"" + this.path + "\",\"session\": null}";
    }

    @Override
    public String getSerial() {
      return this.path;
    }

  }
}

