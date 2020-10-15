/* WARNING! This file should be imported ONLY in tests! */
/* eslint-disable @typescript-eslint/camelcase */
import { Device, Features } from 'trezor-connect';
import { TrezorDevice } from '@suite-types';
import { Account, WalletAccountTransaction } from '@wallet-types';

/**
 * Generate wallet account
 * @param {Partial<Features>} [feat]
 * @returns {Features}
 */
// @ts-ignore
const getWalletAccount = (account?: Partial<Account>): Account => ({
    deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
    index: 0,
    path: "m/44'/60'/0'/0/1",
    descriptor: '0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15',
    accountType: 'normal',
    networkType: 'ethereum',
    symbol: 'eth',
    empty: false,
    visible: true,
    balance: '0',
    availableBalance: '0',
    tokens: [],
    history: { total: 13, tokens: 0, unconfirmed: 0 },
    misc: { nonce: '6' },
    page: { index: 1, size: 25, total: 1 },
    utxo: undefined,
    marker: undefined,
    addresses: undefined,
    ...account,
});

/**
 * device.firmwareRelease property
 * note that values don't make much sense.
 */
const getFirmwareRelease = (): NonNullable<Device['firmwareRelease']> => ({
    isLatest: false,
    isRequired: false,
    isNewer: false,
    changelog: [
        {
            required: false,
            version: [2, 0, 0],
            min_bridge_version: [2, 0, 25],
            min_firmware_version: [2, 0, 0],
            min_bootloader_version: [2, 0, 0],
            url: 'data/firmware/1/trezor-1.8.1.bin',
            fingerprint: '019e849c1eb285a03a92bbad6d18a328af3b4dc6999722ebb47677b403a4cd16',
            changelog:
                '* Fix fault when using the device with no PIN* Fix OMNI transactions parsing',
        },
    ],
    release: {
        required: false,
        version: [2, 0, 0],
        min_bridge_version: [2, 0, 25],
        min_firmware_version: [2, 0, 0],
        min_bootloader_version: [2, 0, 0],
        url: 'data/firmware/1/trezor-1.8.1.bin',
        fingerprint: '019e849c1eb285a03a92bbad6d18a328af3b4dc6999722ebb47677b403a4cd16',
        changelog: '* Fix fault when using the device with no PIN* Fix OMNI transactions parsing',
    },
});

/**
 * Generate device Features
 * @param {Partial<Features>} [feat]
 * @returns {Features}
 */
export const getDeviceFeatures = (feat?: Partial<Features>): Features => ({
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

    const features = getDeviceFeatures(feat);
    return {
        id: features.device_id,
        path: '',
        label: 'My Trezor',
        firmware: 'valid',
        firmwareRelease: getFirmwareRelease(),
        status: 'available',
        mode: 'normal',
        state: undefined,
        features,
        unavailableCapabilities: {},
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
            authConfirm: false,
            instance: undefined,
            ts: 0,
            buttonRequests: [],
            metadata: { status: 'disabled' },
            ...dev,
            ...device,
        };
    }
    return device as TrezorDevice;
};

const getWalletTransaction = (t: Partial<WalletAccountTransaction>): WalletAccountTransaction => {
    return {
        descriptor:
            'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
        deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
        symbol: 'btc',
        type: 'sent',
        txid: '7e58757f43015242c0efa29447bea4583336f2358fdff587b52bbe040ad8982a',
        blockTime: 1565797979,
        blockHeight: 590093,
        blockHash: '00000000000000000017277948d61a631dae6cce1d7fb501301b825599189f51',
        amount: '0.00006497',
        fee: '0.00002929',
        targets: [
            {
                addresses: ['36JkLACrdxARqXXffZk91V9W6SJvghKaVK'],
                amount: '0.00006497',
                isAddress: true,
                n: 0,
            },
        ],
        tokens: [],
        ...t,
    };
};

class BroadcastChannel {
    name: string;
    constructor(name: string) {
        this.name = name;
    }

    get onmessage() {
        return undefined;
    } // getter method
    set onmessage(_handler) {
        // do nothing
    }

    postMessage = (_message: any) => {
        // do nothing
    };
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface Global {
            JestMocks: {
                getDeviceFeatures: typeof getDeviceFeatures;
                getConnectDevice: typeof getConnectDevice;
                getSuiteDevice: typeof getSuiteDevice;
                getWalletAccount: typeof getWalletAccount;
                getWalletTransaction: typeof getWalletTransaction;
                intlMock: typeof intlMock;
            };
            BroadcastChannel: typeof BroadcastChannel;
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
    getWalletAccount,
    getWalletTransaction,
    intlMock,
};

global.BroadcastChannel = BroadcastChannel;

// this helps with debugging - find unhandled promise rejections in jest

// process.on('unhandledRejection', (reason, p) => {
//     console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
// });
