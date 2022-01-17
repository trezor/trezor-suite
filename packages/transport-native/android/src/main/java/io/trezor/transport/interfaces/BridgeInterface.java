package io.trezor.transport.interfaces;

import java.util.List;

public interface BridgeInterface {
  List<TrezorInterface> enumerate();

  TrezorInterface getDeviceByPath(String path);

  void findAlreadyConnectedDevices();
}
