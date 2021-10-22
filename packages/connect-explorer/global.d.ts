import TrezorConnect from 'trezor-connect';

declare global {
    interface Window {
        __TREZOR_CONNECT_SRC?: string;
        TrezorConnect?: typeof TrezorConnect;
    }
}

export {};
