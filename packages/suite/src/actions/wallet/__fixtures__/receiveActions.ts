import * as receiveActions from 'src/actions/wallet/receiveActions';
import { RECEIVE } from '../constants';
import { MODAL, SUITE } from 'src/actions/suite/constants';
import { connectInitThunk } from '@suite-common/connect-init';
import { notificationsActions } from '@suite-common/toast-notifications';

const { getSuiteDevice } = global.JestMocks;

const PATH = "m/49'/0'/0'/0/0";
const ADDRESS = 'AddRe5s';

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
                { type: MODAL.PRESERVE },
                { type: SUITE.LOCK_DEVICE, payload: true },
                { type: SUITE.LOCK_DEVICE, payload: false },
                { type: MODAL.OPEN_USER_CONTEXT },
                { type: RECEIVE.SHOW_ADDRESS, path: PATH, address: ADDRESS },
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
                { type: MODAL.PRESERVE },
                { type: SUITE.LOCK_DEVICE, payload: true },
                { type: SUITE.LOCK_DEVICE, payload: false },
                { type: MODAL.OPEN_USER_CONTEXT },
                { type: RECEIVE.SHOW_ADDRESS, path: PATH, address: ADDRESS },
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
                { type: MODAL.PRESERVE },
                { type: SUITE.LOCK_DEVICE, payload: true },
                { type: SUITE.LOCK_DEVICE, payload: false },
                { type: MODAL.OPEN_USER_CONTEXT },
                { type: RECEIVE.SHOW_ADDRESS, path: PATH, address: ADDRESS },
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
                { type: MODAL.PRESERVE },
                { type: MODAL.CLOSE },
                {
                    type: notificationsActions.addToast.type,
                    payload: {
                        type: 'verify-address-error',
                        error: 'Method for getAddress not defined',
                    },
                },
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
                    payload: { addressPath: PATH, value: ADDRESS },
                },
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
                { type: MODAL.PRESERVE },
                { type: SUITE.LOCK_DEVICE, payload: true },
                { type: SUITE.LOCK_DEVICE, payload: false },
                { type: MODAL.CLOSE },
                {
                    type: notificationsActions.addToast.type,
                    payload: { type: 'verify-address-error', error: 'Runtime error' },
                },
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
                { type: MODAL.PRESERVE },
                { type: SUITE.LOCK_DEVICE, payload: true },
                { type: SUITE.LOCK_DEVICE, payload: false },
                { type: MODAL.CLOSE },
            ],
        },
    },
];
