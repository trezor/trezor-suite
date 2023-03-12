import * as receiveActions from '@wallet-actions/receiveActions';
import { RECEIVE } from '../constants';
import { MODAL, SUITE } from '@suite-actions/constants';
import { connectInitThunk } from '@suite-common/connect-init';
import { notificationsActions } from '@suite-common/toast-notifications';

const { getSuiteDevice } = global.JestMocks;

const PATH = "m/49'/0'/0'/0/0";
const ADDRESS = 'AddRe5s';

const UNAVAILABLE_DEVICE = getSuiteDevice({ available: false });

export default [
    {
        description: 'Show unverified address',
        initialState: undefined,
        mocks: {},
        action: () => receiveActions.showUnverifiedAddress(PATH, ADDRESS),
        result: {
            actions: [
                { type: connectInitThunk.pending.type, payload: undefined },
                { type: connectInitThunk.fulfilled.type, payload: undefined },
                { type: MODAL.OPEN_USER_CONTEXT },
                {
                    type: RECEIVE.SHOW_UNVERIFIED_ADDRESS,
                    path: PATH,
                    address: ADDRESS,
                },
            ],
        },
    },
    {
        description: 'Show unverified address, device is undefined',
        initialState: {
            suite: {
                device: undefined,
                settings: { debug: {} },
            },
        },
        mocks: {},
        action: () => receiveActions.showUnverifiedAddress(PATH, ADDRESS),
        result: {
            actions: [
                { type: connectInitThunk.pending.type, payload: undefined },
                { type: connectInitThunk.fulfilled.type, payload: undefined },
            ],
        },
    },
    {
        description: 'Show address success (bitcoin)',
        initialState: {
            wallet: {
                selectedAccount: {
                    account: {
                        networkType: 'bitcoin',
                    },
                },
                settings: {
                    enabledNetworks: ['btc'],
                },
            },
        },
        mocks: {},
        action: () => receiveActions.showAddress(PATH, ADDRESS),
        result: {
            actions: [
                { type: connectInitThunk.pending.type, payload: undefined },
                { type: connectInitThunk.fulfilled.type, payload: undefined },
                { type: SUITE.LOCK_DEVICE, payload: true },
                { type: SUITE.SET_PROCESS_MODE, payload: 'confirm-addr' },
                { type: MODAL.OPEN_USER_CONTEXT },
                { type: SUITE.LOCK_DEVICE, payload: false },
                { type: MODAL.OPEN_USER_CONTEXT },
                { type: RECEIVE.SHOW_ADDRESS, path: PATH, address: ADDRESS },
                { type: SUITE.SET_PROCESS_MODE, payload: undefined },
            ],
        },
    },
    {
        description: 'Show address success (ethereum)',
        initialState: {
            wallet: {
                selectedAccount: {
                    account: {
                        networkType: 'ethereum',
                    },
                },
                settings: {
                    enabledNetworks: ['eth'],
                },
            },
        },
        mocks: {},
        action: () => receiveActions.showAddress(PATH, ADDRESS),
        result: {
            actions: [
                { type: connectInitThunk.pending.type, payload: undefined },
                { type: connectInitThunk.fulfilled.type, payload: undefined },
                { type: SUITE.LOCK_DEVICE, payload: true },
                { type: SUITE.SET_PROCESS_MODE, payload: 'confirm-addr' },
                { type: MODAL.OPEN_USER_CONTEXT },
                { type: SUITE.LOCK_DEVICE, payload: false },
                { type: MODAL.OPEN_USER_CONTEXT },
                { type: RECEIVE.SHOW_ADDRESS, path: PATH, address: ADDRESS },
                { type: SUITE.SET_PROCESS_MODE, payload: undefined },
            ],
        },
    },
    {
        description: 'Show address success (ripple)',
        initialState: {
            wallet: {
                selectedAccount: {
                    account: {
                        networkType: 'ripple',
                    },
                },
                settings: {
                    enabledNetworks: ['xrp'],
                },
            },
        },
        mocks: {},
        action: () => receiveActions.showAddress(PATH, ADDRESS),
        result: {
            actions: [
                { type: connectInitThunk.pending.type, payload: undefined },
                { type: connectInitThunk.fulfilled.type, payload: undefined },
                { type: SUITE.LOCK_DEVICE, payload: true },
                { type: SUITE.SET_PROCESS_MODE, payload: 'confirm-addr' },
                { type: MODAL.OPEN_USER_CONTEXT },
                { type: SUITE.LOCK_DEVICE, payload: false },
                { type: MODAL.OPEN_USER_CONTEXT },
                { type: RECEIVE.SHOW_ADDRESS, path: PATH, address: ADDRESS },
                { type: SUITE.SET_PROCESS_MODE, payload: undefined },
            ],
        },
    },
    {
        description: 'Show address failed, @trezor/connect method not specified',
        initialState: {
            wallet: {
                selectedAccount: {
                    account: {
                        networkType: 'ripple-2',
                    },
                },
                settings: {
                    enabledNetworks: ['xrp'],
                },
            },
        },
        mocks: {},
        action: () => receiveActions.showAddress(PATH, ADDRESS),
        result: {
            actions: [
                { type: connectInitThunk.pending.type, payload: undefined },
                { type: connectInitThunk.fulfilled.type, payload: undefined },
                {
                    type: notificationsActions.addToast.type,
                    payload: {
                        type: 'verify-address-error',
                        error: 'Method for getAddress not defined',
                    },
                },
                { type: SUITE.SET_PROCESS_MODE, payload: undefined },
            ],
        },
    },
    {
        description: 'Show address, device not connected',
        initialState: {
            suite: {
                settings: { debug: {} },
                device: getSuiteDevice({ connected: false }),
            },
        },
        mocks: {},
        action: () => receiveActions.showAddress(PATH, ADDRESS),
        result: {
            actions: [
                { type: connectInitThunk.pending.type, payload: undefined },
                { type: connectInitThunk.fulfilled.type, payload: undefined },
                {
                    type: MODAL.OPEN_USER_CONTEXT,
                    payload: { device: UNAVAILABLE_DEVICE, addressPath: PATH },
                },
            ],
        },
    },
    {
        description: 'Show address, device is undefined',
        initialState: {
            suite: {
                settings: { debug: {} },
                device: undefined,
            },
        },
        mocks: {},
        action: () => receiveActions.showAddress(PATH, ADDRESS),
        result: {
            actions: [
                { type: connectInitThunk.pending.type, payload: undefined },
                { type: connectInitThunk.fulfilled.type, payload: undefined },
            ],
        },
    },
    {
        description: 'Show address, @trezor/connect error',
        initialState: {
            wallet: {
                selectedAccount: {
                    account: {
                        networkType: 'bitcoin',
                    },
                },
                settings: {
                    enabledNetworks: ['btc'],
                },
            },
        },
        mocks: {
            getAddress: { success: false, payload: { error: 'Runtime error' } },
        },
        action: () => receiveActions.showAddress(PATH, ADDRESS),
        result: {
            actions: [
                { type: connectInitThunk.pending.type, payload: undefined },
                { type: connectInitThunk.fulfilled.type, payload: undefined },
                { type: SUITE.LOCK_DEVICE, payload: true },
                { type: SUITE.LOCK_DEVICE, payload: false },
                {
                    type: notificationsActions.addToast.type,
                    payload: { type: 'verify-address-error', error: 'Runtime error' },
                },
                { type: SUITE.SET_PROCESS_MODE, payload: undefined },
            ],
        },
    },
    {
        description: 'Show address, @trezor/connect permissions not granted',
        initialState: undefined,
        mocks: {
            getAddress: {
                success: false,
                payload: { error: 'Runtime error', code: 'Method_PermissionsNotGranted' },
            },
        },
        action: () => receiveActions.showAddress(PATH, ADDRESS),
        result: {
            actions: [
                { type: connectInitThunk.pending.type, payload: undefined },
                { type: connectInitThunk.fulfilled.type, payload: undefined },
                { type: SUITE.LOCK_DEVICE, payload: true },
                { type: SUITE.LOCK_DEVICE, payload: false },
            ],
        },
    },
];
