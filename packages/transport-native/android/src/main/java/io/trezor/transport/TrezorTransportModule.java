package io.trezor.transport;

import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import io.trezor.transport.bridges.UDPBridge;
import io.trezor.transport.bridges.USBBridge;
import io.trezor.transport.interfaces.BridgeInterface;
import io.trezor.transport.interfaces.TrezorInterface;

import java.util.List;

public class TrezorTransportModule extends ReactContextBaseJavaModule {
  private static final String TAG = "Trezor TransportModule";
  private static ReactApplicationContext reactContext;
  private static BridgeInterface bridge;


  public TrezorTransportModule(ReactApplicationContext context) {
    super(context);
    reactContext = context;

    if (Utils.isEmulator()) {
      Log.d(TAG, "We're in emulator!");
      bridge = UDPBridge.getInstance(context);
    } else {
      Log.d(TAG, "We're not in emulator!");
      bridge = USBBridge.getInstance(context);
    }

    bridge.findAlreadyConnectedDevices();
  }

  @Override
  public String getName() {
    // This name is used as property name in imported NativeModules in JS.
    // Used in src/index.ts
    return "TrezorTransport";
  }

  @ReactMethod
  public void enumerate(Promise promise) {
    Log.d(TAG, "Enumerate start");
    try {
      List<TrezorInterface> trezorDeviceList = bridge.enumerate();
      Log.d(TAG, "Enumerate" + trezorDeviceList);

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
    Log.i(TAG, "write to device " + path + " ");
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
    Log.i(TAG, "read from device " + path + " ");
    try {
      Log.i(TAG, "read from device 1");
      TrezorInterface device = bridge.getDeviceByPath(path);
            Log.i(TAG, "read from device 2");

      if (device != null) {
        byte[] bytes = device.rawRead();
              Log.i(TAG, "read from device 3");

        WritableMap map = Arguments.createMap();
              Log.i(TAG, "read from device 4");

        map.putString("data", Utils.byteArrayToHexString(bytes));
              Log.i(TAG, "read from device 5");

        promise.resolve(map);
      } else {
        promise.reject("EUNSPECIFIED", "error device not found");
      }
    } catch (Exception e) {
      promise.reject("EUNSPECIFIED", e.toString());
    }
  }

}
