import TrezorConnect from '@trezor/connect-web';

declare global {
    interface Window {
        __TREZOR_CONNECT_SRC?: string;
        TrezorConnect?: typeof TrezorConnect;
    }
}
