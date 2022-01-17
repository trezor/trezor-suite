package io.trezor.transport.interfaces;

import android.content.Context;

import io.trezor.transport.TrezorException;

public interface TrezorInterface {
  void rawPost(byte[] raw);

  byte[] rawRead();

  void openConnection(Context context) throws TrezorException;

  void closeConnection();

  String getSerial();
}
