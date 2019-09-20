/* WARNING! This file should be imported ONLY in tests! */
/* eslint-disable @typescript-eslint/camelcase */
import { Device, Features } from 'trezor-connect';
import { TrezorDevice } from '@suite-types';

/**
 * Generate device Features
 * @param {Partial<Features>} [feat]
 * @returns {Features}
 */
const getDeviceFeatures = (feat?: Partial<Features>): Features => ({
    device_id: 'device-id',
    flags: 0,
    initialized: true,
    label: 'My Trezor',
    major_version: 2,
    minor_version: 1,
    model: 'T',
    needs_backup: false,
    no_backup: false,
    passphrase_cached: true,
    passphrase_protection: false,
    patch_version: 1,
    pin_cached: false,
    pin_protection: false,
    revision: '3761663164353835',
    unfinished_backup: false,
    vendor: 'trezor.io',
    ...feat,
});

/**
 * simplified Device from 'trezor-connect'
 * @param {Partial<Device>} [dev]
 * @param {Partial<Features>} [feat]
 * @returns {Device}
 */
export const getConnectDevice = (dev?: Partial<Device>, feat?: Partial<Features>): Device => {
    if (dev && typeof dev.type === 'string' && dev.type !== 'acquired') {
        return {
            type: dev.type,
            path: dev && dev.path ? dev.path : '1',
            label: dev && dev.label ? dev.label : 'My Trezor',
            features: undefined,
        };
    }

    return {
        path: '',
        label: 'My Trezor',
        firmware: 'valid',
        status: 'available',
        mode: 'normal',
        state: undefined,
        features: getDeviceFeatures(feat),
        ...dev,
        type: 'acquired',
    };
};

/**
 * Extended device from suite reducer
 * @param {Partial<TrezorDevice>} [dev]
 * @param {Partial<Features>} [feat]
 * @returns {TrezorDevice}
 */
const getSuiteDevice = (dev?: Partial<TrezorDevice>, feat?: Partial<Features>): TrezorDevice => {
    const device = getConnectDevice(dev, feat);
    if (device.type === 'acquired') {
        return {
            useEmptyPassphrase: true,
            remember: false,
            connected: false,
            available: false,
            instance: undefined,
            instanceLabel: 'My Trezor',
            instanceName: undefined,
            ts: 0,
            ...dev,
            ...device,
        };
    }
    return device as TrezorDevice;
};

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface Global {
            JestMocks: {
                getDeviceFeatures: typeof getDeviceFeatures;
                getConnectDevice: typeof getConnectDevice;
                getSuiteDevice: typeof getSuiteDevice;
                intlMock: typeof intlMock;
            };
        }
    }
}

const intlMock = {
    // @ts-ignore
    formatMessage: (s: any) => s.defaultMessage,
};

global.JestMocks = {
    getDeviceFeatures,
    getConnectDevice,
    getSuiteDevice,
    intlMock,
};
