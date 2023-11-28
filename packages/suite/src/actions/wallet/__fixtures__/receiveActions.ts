import { connectInitThunk } from '@suite-common/connect-init';
import { testMocks } from '@suite-common/test-utils';
import { notificationsActions } from '@suite-common/toast-notifications';

import * as receiveActions from 'src/actions/wallet/receiveActions';
import { MODAL, SUITE } from 'src/actions/suite/constants';

import { RECEIVE } from '../constants';
import { confirmAddressOnDeviceThunk } from '@suite-common/wallet-core';

const PATH = "m/49'/0'/0'/0/0";
const ADDRESS = 'AddRe5s';

export default [
    {
        description: 'Show unverified address',
        initialState: undefined,
        mocks: {},
        action: () => receiveActions.openAddressModal({ addressPath: PATH, value: ADDRESS }),
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
        mocks: {},
        action: () => receiveActions.showAddress(PATH, ADDRESS),
        result: {
            actions: [
                { type: connectInitThunk.pending.type, payload: undefined },
                { type: connectInitThunk.fulfilled.type, payload: undefined },
                { type: MODAL.PRESERVE },
                { type: confirmAddressOnDeviceThunk.pending.type, payload: undefined },
                { type: SUITE.LOCK_DEVICE, payload: true },
                { type: SUITE.LOCK_DEVICE, payload: false },
                { type: confirmAddressOnDeviceThunk.fulfilled.type, payload: { success: true } },
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
                        key: 'selected-account-key',
                        networkType: 'ethereum',
                    },
                },
                accounts: [{ key: 'selected-account-key', networkType: 'ethereum', symbol: 'eth' }],
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
                { type: confirmAddressOnDeviceThunk.pending.type, payload: undefined },
                { type: SUITE.LOCK_DEVICE, payload: true },
                { type: SUITE.LOCK_DEVICE, payload: false },
                { type: confirmAddressOnDeviceThunk.fulfilled.type, payload: { success: true } },
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
                        key: 'selected-account-key',
                        networkType: 'ripple',
                    },
                },
                accounts: [{ key: 'selected-account-key', networkType: 'ripple', symbol: 'xrp' }],
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
                { type: confirmAddressOnDeviceThunk.pending.type, payload: undefined },
                { type: SUITE.LOCK_DEVICE, payload: true },
                { type: SUITE.LOCK_DEVICE, payload: false },
                { type: confirmAddressOnDeviceThunk.fulfilled.type, payload: { success: true } },
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
                accounts: [{ key: 'selected-account-key', networkType: 'ripple', symbol: 'xrp' }],
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
                { type: confirmAddressOnDeviceThunk.pending.type, payload: undefined },
                { type: confirmAddressOnDeviceThunk.fulfilled.type, payload: { success: false } },
                { type: MODAL.CLOSE },
                {
                    type: notificationsActions.addToast.type,
                    payload: {
                        type: 'verify-address-error',
                        error: 'Device or account does not exist.',
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
            },
            device: {
                selectedDevice: testMocks.getSuiteDevice({ connected: false }),
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
        mocks: {
            getAddress: { success: false, payload: { error: 'Runtime error' } },
        },
        action: () => receiveActions.showAddress(PATH, ADDRESS),
        result: {
            actions: [
                { type: connectInitThunk.pending.type, payload: undefined },
                { type: connectInitThunk.fulfilled.type, payload: undefined },
                { type: MODAL.PRESERVE },
                { type: confirmAddressOnDeviceThunk.pending.type, payload: undefined },
                { type: SUITE.LOCK_DEVICE, payload: true },
                { type: SUITE.LOCK_DEVICE, payload: false },
                { type: confirmAddressOnDeviceThunk.fulfilled.type, payload: { success: false } },
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
                { type: confirmAddressOnDeviceThunk.pending.type, payload: undefined },
                { type: SUITE.LOCK_DEVICE, payload: true },
                { type: SUITE.LOCK_DEVICE, payload: false },
                { type: confirmAddressOnDeviceThunk.fulfilled.type, payload: { success: false } },
                { type: MODAL.CLOSE },
            ],
        },
    },
];
