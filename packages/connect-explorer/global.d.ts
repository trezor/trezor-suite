import TrezorConnect from '@trezor/connect-web';

declare global {
    interface Window {
        TrezorConnect?: typeof TrezorConnect;
        router?: any;
    }
}
