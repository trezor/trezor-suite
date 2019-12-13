package io.trezor.suite.interfaces;

import java.util.List;

public interface BridgeInterface {
    public List<TrezorInterface> enumerate();
    public TrezorInterface getDeviceByPath(String path);
    public void findAlreadyConnectedDevices();
}
