package io.trezor.suite;

public class TrezorException extends RuntimeException {
    public TrezorException(String message) {
        super(message);
    }

    public TrezorException(String message, Throwable cause) {
        super(message, cause);
    }
}
