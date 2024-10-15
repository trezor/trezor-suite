import { Device } from '@trezor/connect';

export type PartialDevice = {
    features?: Device['features'];
    firmwareType?: Device['firmwareType'];
};
