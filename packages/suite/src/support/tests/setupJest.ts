/* WARNING! This file should be imported ONLY in tests! */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable require-await */

import { Device, Features } from 'trezor-connect';
import { TrezorDevice } from '@suite-types';
import { Account, WalletAccountTransaction } from '@wallet-types';
// in-memory implementation of indexedDB
import 'fake-indexeddb/auto';
import { MessageSystem, Action } from '@suite/types/suite/messageSystem';
import { Node, Page, Category } from '@suite/types/suite/guide';
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
export const getFirmwareRelease = (): NonNullable<Device['firmwareRelease']> => ({
    isLatest: true,
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
    latest: {
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
    vendor: 'trezor.io',
    major_version: 2,
    minor_version: 1,
    patch_version: 1,
    bootloader_mode: null,
    device_id: 'device-id',
    pin_protection: false,
    passphrase_protection: false,
    language: 'en-US',
    label: 'My Trezor',
    initialized: true,
    revision: 'df0963ec',
    bootloader_hash: '7447a41717022e3eb32011b00b2a68ebb9c7f603cdc730e7307850a3f4d62a5c',
    imported: null,
    unlocked: true,
    firmware_present: null,
    needs_backup: false,
    flags: 0,
    model: 'T',
    fw_major: null,
    fw_minor: null,
    fw_patch: null,
    fw_vendor: null,
    unfinished_backup: false,
    no_backup: false,
    recovery_mode: false,
    capabilities: [],
    backup_type: 'Bip39',
    sd_card_present: false,
    sd_protection: false,
    wipe_code_protection: false,
    session_id: 'session-id',
    passphrase_always_on_device: false,
    safety_checks: 'Strict',
    auto_lock_delay_ms: 60000,
    display_rotation: 0,
    experimental_features: false,
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
        } as Device;
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
    } as Device;
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
        } as TrezorDevice;
    }
    return device as TrezorDevice;
};

const getWalletTransaction = (t?: Partial<WalletAccountTransaction>): WalletAccountTransaction => ({
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
});

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
            blockchainSetCustomBackend: jest.fn(async _params => ({
                success: true,
                ...getFixture(),
                _params,
            })),
            blockchainSubscribe: jest.fn(async _params => ({
                success: true,
                ...getFixture(),
                _params,
            })),
            blockchainSubscribeFiatRates: jest.fn(async _params => ({
                success: true,
                ...getFixture(),
                _params,
            })),
            blockchainUnsubscribeFiatRates: jest.fn(async _params => ({
                success: true,
                ...getFixture(),
                _params,
            })),
            blockchainEstimateFee: jest.fn(async _params => ({
                success: true,
                payload: { levels: [{}] },
                ...getFixture(),
                _params,
            })),
            blockchainGetTransactions: jest.fn(async _params => ({
                success: true,
                payload: { txid: 'foo' },
                ...getFixture(),
                _params,
            })),
            blockchainDisconnect: jest.fn(async _params => ({
                success: true,
                ...getFixture(),
                _params,
            })),
            getAccountInfo: jest.fn(async _params => ({
                success: false,
                ...getFixture(),
                _params,
            })),
            composeTransaction: jest.fn(async _params => {
                const fixture = getFixture();
                if (fixture && typeof fixture.delay === 'number') {
                    await new Promise(resolve => setTimeout(resolve, fixture.delay));
                }
                return { success: false, payload: { error: 'error' }, ...fixture, _params };
            }),
            signTransaction: jest.fn(async _params => ({
                success: false,
                payload: { error: 'error' },
                ...getFixture(),
                _params,
            })),
            ethereumSignTransaction: jest.fn(async _params => ({
                success: false,
                payload: { error: 'error' },
                ...getFixture(),
                _params,
            })),
            rippleSignTransaction: jest.fn(async _params => ({
                success: false,
                payload: { error: 'error' },
                ...getFixture(),
                _params,
            })),
            pushTransaction: jest.fn(async _params => ({
                success: true,
                payload: { txid: 'txid' },
                ...getFixture(),
                _params,
            })),
            changePin: () => ({
                success: true,
                payload: {
                    message: 'great success',
                },
            }),
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

const getMessageSystemConfig = (
    root?: Partial<MessageSystem>,
    action1?: Partial<Action>,
    action2?: Partial<Action>,
): MessageSystem => ({
    version: 1,
    timestamp: '2021-03-03T03:48:16+00:00',
    sequence: 1,
    actions: [
        {
            conditions: [
                {
                    duration: {
                        from: '2021-03-01T12:10:00.000Z',
                        to: '2022-01-31T12:10:00.000Z',
                    },
                    os: {
                        macos: ['10.14', '10.18', '11'],
                        linux: '<20.04',
                        windows: '!',
                        android: '*',
                        ios: '13',
                        chromeos: '*',
                    },
                    environment: {
                        desktop: '<21.5',
                        mobile: '!',
                        web: '<22',
                    },
                    browser: {
                        firefox: ['82', '83'],
                        chrome: '*',
                        chromium: '!',
                    },
                    settings: [
                        {
                            tor: true,
                            btc: true,
                        },
                        {
                            tor: false,
                            ltc: true,
                        },
                    ],
                    transport: {
                        bridge: ['2.0.30', '2.0.27'],
                        webusbplugin: '*',
                    },
                    devices: [
                        {
                            model: 'T',
                            firmware: '2.1.1',
                            variant: 'regular',
                            vendor: 'trezor.io',
                        },
                    ],
                },
            ],
            message: {
                id: '0f3ec64d-c3e4-4787-8106-162f3ac14c34',
                priority: 10,
                dismissible: true,
                variant: 'warning',
                category: 'banner',
                content: {
                    'en-GB': 'New Trezor firmware is available!',
                    en: 'New Trezor firmware is available!',
                    es: 'El nuevo firmware de Trezor está disponible!',
                    cs: 'Nová verze Trezor firmware je k dispozici',
                    ru: 'Доступна новая прошивка Trezor!',
                },
                cta: {
                    action: 'internal-link',
                    link: 'firmware-index',
                    label: {
                        'en-GB': 'Update now',
                        en: 'Update now',
                        es: 'Actualizar ahora',
                        cs: 'Aktualizovat',
                        ru: 'Обновить сейчас',
                    },
                },
            },
            ...action1,
        },
        {
            conditions: [],
            message: {
                id: '5213c64d-c3e4-4787-8106-162f3ac14c34',
                priority: 8,
                dismissible: false,
                variant: 'info',
                category: ['banner', 'context', 'modal'],
                content: {
                    'en-GB': 'New Trezor app is available!',
                    en: 'New Trezor app is available!',
                    es: 'La nueva aplicación Trezor está disponible!',
                    cs: 'Nová Trezor aplikace je k dispozici!',
                    ru: 'Доступно новое приложение Trezor!',
                },
                cta: {
                    action: 'external-link',
                    link: 'https://example.com/',
                    label: {
                        'en-GB': 'Download now',
                        en: 'Download now',
                        es: 'Descargar ahora',
                        cs: 'Stáhnout nyní',
                        ru: 'Скачать сейчас',
                    },
                },
                modal: {
                    title: {
                        'en-GB': 'Update now',
                        en: 'Update now',
                        es: 'Actualizar ahora',
                        cs: 'Aktualizovat',
                        ru: 'Обновить сейчас',
                    },
                    image: 'https://example.com/example.png',
                },
                context: {
                    domain: ['coins.*.receive', 'coins.btc'],
                },
            },
            ...action2,
        },
    ],
    ...root,
});

const getGuideNode = (type: string, id?: string): Node => {
    let result: Node;
    if (type === 'page' && id === '/') {
        result = {
            type: 'page',
            id: '/',
            locales: ['en'],
            title: {
                en: 'Locktime',
            },
        } as Page;
    } else if (type === 'page' && id !== '/') {
        result = {
            type: 'page',
            id: '/suite-basics/send/locktime.md',
            locales: ['en'],
            title: {
                en: 'Locktime',
            },
        } as Page;
    } else {
        result = {
            type: 'category',
            id: '/',
            locales: ['en'],
            title: {
                en: 'test title',
            },
            children: [
                {
                    type: 'category',
                    id: '/privacy',
                    locales: ['en'],
                    title: {
                        en: 'Privacy',
                    },
                    children: [],
                },
                {
                    type: 'category',
                    id: '/security',
                    locales: ['en'],
                    title: {
                        en: 'Security',
                    },
                    children: [
                        {
                            type: 'category',
                            id: '/security/suite-basics',
                            locales: ['en'],
                            title: {
                                en: 'Suite basics',
                            },
                            children: [
                                {
                                    type: 'category',
                                    id: '/security/suite-basics/send',
                                    locales: ['en'],
                                    title: {
                                        en: 'Send',
                                    },
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
            ],
        } as Category;
    }

    return result;
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
                getFirmwareRelease: typeof getFirmwareRelease;
                getDeviceFeatures: typeof getDeviceFeatures;
                getConnectDevice: typeof getConnectDevice;
                getSuiteDevice: typeof getSuiteDevice;
                getWalletAccount: typeof getWalletAccount;
                getWalletTransaction: typeof getWalletTransaction;
                getTrezorConnect: typeof getTrezorConnect;
                getMessageSystemConfig: typeof getMessageSystemConfig;
                getGuideNode: typeof getGuideNode;
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
    getFirmwareRelease,
    getDeviceFeatures,
    getConnectDevice,
    getSuiteDevice,
    getWalletAccount,
    getWalletTransaction,
    getTrezorConnect,
    getMessageSystemConfig,
    getGuideNode,
    intlMock,
};

// @ts-ignore
global.BroadcastChannel = BroadcastChannel;

// this helps with debugging - find unhandled promise rejections in jest

// process.on('unhandledRejection', (reason, p) => {
//     console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
// });
