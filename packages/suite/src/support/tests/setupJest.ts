/* WARNING! This file should be imported ONLY in tests! */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable require-await */

import { Device, Features } from 'trezor-connect';
import { TrezorDevice } from '@suite-types';
import { Account, WalletAccountTransaction } from '@wallet-types';
// in-memory implementation of indexedDB
import 'fake-indexeddb/auto';
/**
 * Generate wallet account
 * @param {Partial<Account>} [account]
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
    passphrase_protection: false,
    patch_version: 1,
    pin_protection: false,
    revision: '3761663164353835',
    unfinished_backup: false,
    vendor: 'trezor.io',
    capabilities: [],
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

const getWalletTransaction = (t?: Partial<WalletAccountTransaction>): WalletAccountTransaction => {
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
        amount: '0.00001',
        totalSpent: '0.00001144',
        fee: '0.00000144',
        targets: [
            {
                addresses: ['mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q'],
                amount: '0.00001',
                isAccountTarget: true,
                isAddress: true,
                n: 1,
            },
        ],
        tokens: [],
        details: {
            vin: [
                {
                    addresses: ['tb1q4nytpy37cuz8yndtfqpau4nzsva0jh787ny3yg'],
                    isAddress: true,
                    n: 0,
                    sequence: 4294967294,
                    txid: 'c894b064beb2f9be4b0d64cffcd89da2e8dc6decac399f5617323a303e07e4e1',
                    value: '0.80720012',
                },
            ],
            vout: [
                {
                    addresses: ['tb1q4s560ew83wcd6lcjg7uku9qlx4p6gwh74q4jap'],
                    hex: '0014ac29a7e5c78bb0dd7f1247b96e141f3543a43afe',
                    isAddress: true,
                    n: 0,
                    value: '0.80718868',
                },
                {
                    addresses: ['mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q'],
                    hex: '76a914a579388225827d9f2fe9014add644487808c695d88ac',
                    isAddress: true,
                    n: 1,
                    value: '0.00001',
                },
            ],
            size: 225,
            totalInput: '0.80720012',
            totalOutput: '0.80719868',
        },
        ...t,
    };
};

// Mocked TrezorConnect used in various tests
const getTrezorConnect = <M>(methods?: M) => {
    // event listeners
    const listeners: { [key: string]: (e: any) => void } = {};
    // methods response fixtures
    let fixtures: Record<string, any> | Record<string, any>[] | undefined;
    const getFixture = () => {
        if (Array.isArray(fixtures)) {
            return fixtures.shift();
        }
        return fixtures;
    };

    return {
        __esModule: true, // export as module
        default: {
            // define mocked TrezorConnect methods
            init: () => {},
            on: (event: string, cb: (e: any) => void) => {
                listeners[event] = cb;
            },
            off: () => {},
            blockchainSetCustomBackend: jest.fn(async _params => {
                return { success: true, ...getFixture(), _params };
            }),
            blockchainSubscribe: jest.fn(async _params => {
                return { success: true, ...getFixture(), _params };
            }),
            blockchainSubscribeFiatRates: jest.fn(async _params => {
                return { success: true, ...getFixture(), _params };
            }),
            blockchainUnsubscribeFiatRates: jest.fn(async _params => {
                return { success: true, ...getFixture(), _params };
            }),
            blockchainEstimateFee: jest.fn(async _params => {
                return { success: true, payload: { levels: [{}] }, ...getFixture(), _params };
            }),
            blockchainGetTransactions: jest.fn(async _params => {
                return { success: true, payload: { txid: 'foo' }, ...getFixture(), _params };
            }),
            blockchainDisconnect: jest.fn(async _params => {
                return { success: true, ...getFixture(), _params };
            }),
            getAccountInfo: jest.fn(async _params => {
                return { success: false, ...getFixture(), _params };
            }),
            composeTransaction: jest.fn(async _params => {
                const fixture = getFixture();
                if (fixture && typeof fixture.delay === 'number') {
                    await new Promise(resolve => setTimeout(resolve, fixture.delay));
                }
                return { success: false, payload: { error: 'error' }, ...fixture, _params };
            }),
            signTransaction: jest.fn(async _params => {
                return { success: false, payload: { error: 'error' }, ...getFixture(), _params };
            }),
            ethereumSignTransaction: jest.fn(async _params => {
                return { success: false, payload: { error: 'error' }, ...getFixture(), _params };
            }),
            rippleSignTransaction: jest.fn(async _params => {
                return { success: false, payload: { error: 'error' }, ...getFixture(), _params };
            }),
            pushTransaction: jest.fn(async _params => {
                return { success: true, payload: { txid: 'txid' }, ...getFixture(), _params };
            }),
            changePin: () => {
                return {
                    success: true,
                    payload: {
                        message: 'great success',
                    },
                };
            },
            // additional methods used by s

            setTestFixtures: (f?: typeof fixtures) => {
                fixtures = f;
            },
            getTestFixtures: () => fixtures,
            emit: (event: string, data: any) => {
                listeners[event].call(undefined, {
                    event,
                    ...data,
                });
            },
            ...methods,
        },
        DEVICE_EVENT: 'DEVICE_EVENT',
        UI_EVENT: 'UI_EVENT',
        TRANSPORT_EVENT: 'TRANSPORT_EVENT',
        BLOCKCHAIN_EVENT: 'BLOCKCHAIN_EVENT',
        DEVICE: {},
        BLOCKCHAIN: {
            CONNECT: 'blockchain-connect',
            BLOCK: 'blockchain-block',
            NOTIFICATION: 'blockchain-notification',
            ERROR: 'blockchain-error',
        },
        TRANSPORT: {},
        UI: {
            REQUEST_PIN: 'ui-request_pin',
            REQUEST_BUTTON: 'ui-request_button',
        },
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
                getTrezorConnect: typeof getTrezorConnect;
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
    getTrezorConnect,
    intlMock,
};

// @ts-ignore
global.BroadcastChannel = BroadcastChannel;

// this helps with debugging - find unhandled promise rejections in jest

// process.on('unhandledRejection', (reason, p) => {
//     console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
// });
