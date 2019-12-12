package io.trezor.suite;

import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import io.trezor.suite.bridge.UDPBridge;
import io.trezor.suite.bridge.USBBridge;
import io.trezor.suite.interfaces.BridgeInterface;
import io.trezor.suite.interfaces.TrezorInterface;

import java.util.List;

public class BridgeModule extends ReactContextBaseJavaModule {
    private static final String TAG = BridgeModule.class.getSimpleName();
    private static ReactApplicationContext reactContext;
    private static BridgeInterface bridge;

    BridgeModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
        if (Utils.isEmulator()){
            Log.d(TAG, "We're in emulator!");
            bridge = UDPBridge.getInstance(context);
        }else {
            Log.d(TAG, "We're not in emulator!");
            bridge = USBBridge.getInstance(context);
        }
        // hackish way to get devices that were already connected
        bridge.findAlreadyConnectedDevices();
    }

    @Override
    public String getName() {
        return "RNBridge";
    }

    @ReactMethod
    public void enumerate(Promise promise) {
        try {
            List<TrezorInterface> trezorDeviceList = bridge.enumerate();

            // translate TrezorDevice object to react-native response
            WritableArray array = Arguments.createArray();
            for (TrezorInterface device : trezorDeviceList) {
                WritableMap d = Arguments.createMap();
                d.putString("path", device.getSerial()); // TODO: no serial (bootloader)
                d.putBoolean("debug", false); // debugLink, disabled for now
                array.pushMap(d);
            }
            promise.resolve(array);
        } catch (Exception e) {
            promise.reject("EUNSPECIFIED", e.toString());
        }
    }

    @ReactMethod
    public void acquire(String path, Boolean debugLink, Promise promise) {
        Log.i(TAG, "acquire " + path + " ");
        try {
            TrezorInterface device = bridge.getDeviceByPath(path); // TODO: debugLink interface
            if (device != null) {
                Log.d(TAG, "Opening connection");
                device.openConnection(reactContext);
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("EUNSPECIFIED", e.toString());
        }
    }

    @ReactMethod
    public void release(String path, Boolean debugLink, Boolean shouldClose, Promise promise) {
        Log.i(TAG, "close connection " + path + " ");
        promise.resolve(true);
        try {
            TrezorInterface device = bridge.getDeviceByPath(path);
            if (device != null) {
                device.closeConnection();
            }
        } catch (Exception e) {
            promise.reject("EUNSPECIFIED", e.toString());
        }
    }

    @ReactMethod
    public void write(String path, Boolean debugLink, String data, Promise promise) {
        try {
            TrezorInterface device = bridge.getDeviceByPath(path);
            byte[] bytes = Utils.hexStringToByteArray(data);
            if (device != null) {
                device.rawPost(bytes);
                promise.resolve(Utils.byteArrayToHexString(bytes));
            } else {
                promise.reject("EUNSPECIFIED", "error device not found");
            }

        } catch (Exception e) {
            promise.reject("EUNSPECIFIED", e.toString());
        }
    }

    @ReactMethod
    public void read(String path, Boolean debugLink, Promise promise) {
        try {
            TrezorInterface device = bridge.getDeviceByPath(path);
            if (device != null) {
                byte[] bytes = device.rawRead();
                WritableMap map = Arguments.createMap();
                map.putString("data", Utils.byteArrayToHexString(bytes));
                promise.resolve(map);
            } else {
                promise.reject("EUNSPECIFIED", "error device not found");
            }
        } catch (Exception e) {
            promise.reject("EUNSPECIFIED", e.toString());
        }
    }

}