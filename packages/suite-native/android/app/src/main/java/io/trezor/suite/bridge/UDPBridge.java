package io.trezor.suite.bridge;

import android.content.Context;
import android.util.Log;

import io.trezor.suite.TrezorException;
import io.trezor.suite.Utils;
import io.trezor.suite.interfaces.BridgeInterface;
import io.trezor.suite.interfaces.TrezorInterface;

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

public class UDPBridge implements BridgeInterface {
    private static final String TAG = UDPBridge.class.getSimpleName();
    private static final int EMULATOR_UDP_PORT = 21324;
    private static UDPBridge instance;

    private Context context;

    private List<TrezorInterface> trezorDeviceList;

    public UDPBridge(Context context){
        this.context = context;
    }

    public static UDPBridge getInstance(Context context){
        if (instance==null){
            instance = new UDPBridge(context);
        }
        return instance;
    }

    @Override
    public List<TrezorInterface> enumerate() {
        if (trezorDeviceList == null || trezorDeviceList.size() == 0) {
            trezorDeviceList = new ArrayList<>();
            if (checkDevice()){
                trezorDeviceList.add(new TrezorDevice("emulator"));
                return trezorDeviceList;
            }else{
                return trezorDeviceList;
            }
        } else{
            if (!checkDevice()) {
                trezorDeviceList = new ArrayList<>();
            }
            return trezorDeviceList;
        }
    }

    @Override
    public TrezorInterface getDeviceByPath(String path) {
        if (trezorDeviceList.size()>0){
            return trezorDeviceList.get(0);
        }else{
            return enumerate().get(0);
        }
    }

    @Override
    public void findAlreadyConnectedDevices() {
    }

    private boolean checkDevice(){
        byte[] firstMessage = Utils.hexStringToByteArray("2323000000000000");
        String firstMessageResponse = "23230011000000A88802000A097472657A6F722E696F1002180120093218344130463046394232313336383439413043443945463042380040004A07656E676C69736852047465737490020060016A0E64303839376162635F6469727479800100880100980100A00100AA010154D80100E00100E80100F00101F00102F00103F00104F00105F00106F00107F00108F00109F0010AF00111F0010BF0010CF0010DF0010EF0010FF00110F8010080020100000000000000000000000000";
        byte[] secondMessage = Utils.hexStringToByteArray("23230001000000020a00");
        String secondMessageResponse = "23230002000000020A000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
        TrezorInterface trezorDevice = new TrezorDevice("emulator");
        try {
            trezorDevice.openConnection(context);
            trezorDevice.rawPost(firstMessage);
            byte[] b = trezorDevice.rawRead();
            trezorDevice.rawPost(secondMessage);
            byte[] b2 = trezorDevice.rawRead();
            return firstMessageResponse.equals(Utils.byteArrayToHexString(b)) && secondMessageResponse.equals(Utils.byteArrayToHexString(b2));
        }catch (TrezorException e){
            return false;
        }
    }

    public static class TrezorDevice implements TrezorInterface{
        private static final String TAG = "UDP"+ UDPBridge.TrezorDevice.class.getSimpleName();

        private String path;
        private DatagramSocket socket;
        private InetAddress socketAddress;

        public TrezorDevice(String path){
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

        }

        @Override
        public byte[] rawRead() {
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
                    throw new TrezorException("Socket IOException",e);
                }
                Log.i(TAG, String.format("messageRead: Read chunk: %d bytes", b.length));

                if (b.length < 9 || b[0] != (byte) '?' || b[1] != (byte) '#' || b[2] != (byte) '#') {
                    if (invalidChunksCounter++ > 5)
                        Log.e(TAG,"THROW EXCEPTION");
                    continue;
                }
                if (b[0] != (byte) '?' || b[1] != (byte) '#' || b[2] != (byte) '#')
                    continue;

                msg_size = (((int)b[5] & 0xFF) << 24)
                        + (((int)b[6] & 0xFF) << 16)
                        + (((int)b[7] & 0xFF) << 8)
                        + ((int)b[8] & 0xFF);

                data = ByteBuffer.allocate(msg_size + 1024);
                data.put(b, 1, b.length-1);
                break;
            }

            invalidChunksCounter = 0;

            // read the rest of the data
            while (data.position() < msg_size) {
                datagramPacketIn = new DatagramPacket(b, 0, 64, socketAddress, EMULATOR_UDP_PORT);
                try {
                    socket.receive(datagramPacketIn);
                } catch (IOException e) {
                    throw new TrezorException("Socket IOException",e);
                }
                Log.i(TAG, String.format("messageRead: Read chunk (cont): %d bytes", b.length));
                if (b[0] != (byte) '?') {
                    if (invalidChunksCounter++ > 5)
                        Log.e(TAG,"THROW EXCEPTION");
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
                socketAddress = InetAddress.getByName("10.0.2.2");
                if (socket == null) {
                    socket = new DatagramSocket();
                    socket.setSoTimeout(500);
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
