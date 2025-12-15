import type TrezorConnect from '@trezor/connect';

export type ConnectKey = keyof typeof TrezorConnect;
export type ConnectWebKey = ConnectKey | 'requestWebUSBDevice' | 'disableWebUSB';
