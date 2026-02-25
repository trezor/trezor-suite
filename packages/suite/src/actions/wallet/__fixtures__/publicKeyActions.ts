import { connectInitThunk } from '@suite-common/connect-init';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { notificationsActions } from '@suite-common/toast-notifications';

import { MODAL } from 'src/actions/suite/constants';
import * as publicKeyActions from 'src/actions/wallet/publicKeyActions';

const LOCK_DEVICE = 'notImplemented/lockDevice';

export default [
    {
        description: 'Show unverified public key',
        initialState: undefined,
        mocks: {},
        action: publicKeyActions.openXpubModal,
        result: {
            actions: [
                { type: connectInitThunk.pending.type, payload: undefined },
                { type: connectInitThunk.fulfilled.type, payload: undefined },
                { type: MODAL.OPEN_USER_CONTEXT },
            ],
        },
    },
    {
        description: 'Show public key success (bitcoin)',
        initialState: undefined,
        mocks: {},
        action: publicKeyActions.showXpub,
        result: {
            actions: [
                { type: connectInitThunk.pending.type, payload: undefined },
                { type: connectInitThunk.fulfilled.type, payload: undefined },
                { type: MODAL.PRESERVE },
                { type: LOCK_DEVICE },
                { type: LOCK_DEVICE },
                { type: '@suite/device/removeButtonRequests' },

                { type: MODAL.OPEN_USER_CONTEXT },
            ],
        },
    },
    {
        description: 'Show public key success (cardano)',
        initialState: {
            networkType: 'cardano',
        },
        mocks: {},
        action: publicKeyActions.showXpub,
        result: {
            actions: [
                { type: connectInitThunk.pending.type, payload: undefined },
                { type: connectInitThunk.fulfilled.type, payload: undefined },
                { type: MODAL.PRESERVE },
                { type: LOCK_DEVICE },
                { type: LOCK_DEVICE },
                { type: '@suite/device/removeButtonRequests' },
                { type: MODAL.OPEN_USER_CONTEXT },
            ],
        },
    },
    {
        description: 'Show public key errored, @trezor/connect method not specified',
        initialState: {
            networkType: 'ethereum',
        },
        mocks: {},
        action: publicKeyActions.showXpub,
        result: {
            actions: [
                { type: connectInitThunk.pending.type, payload: undefined },
                { type: connectInitThunk.fulfilled.type, payload: undefined },
                { type: MODAL.PRESERVE },
                { type: MODAL.CLOSE },
                {
                    type: notificationsActions.addToast.type,
                    payload: {
                        type: 'verify-xpub-error',
                        error: 'Method for getPublicKey not defined',
                    },
                },
            ],
        },
    },
    {
        description: 'Show public key, device not connected',
        initialState: {
            device: {
                selectedDevice: mockSuiteDevice({ connected: false }),
                devices: [],
            },
        },
        mocks: {},
        action: publicKeyActions.showXpub,
        result: {
            actions: [
                { type: connectInitThunk.pending.type, payload: undefined },
                { type: connectInitThunk.fulfilled.type, payload: undefined },
                {
                    type: MODAL.OPEN_USER_CONTEXT,
                },
            ],
        },
    },
    {
        description: 'Show public key, device is undefined',
        initialState: {
            device: {
                selectedDevice: undefined,
                devices: [],
            },
        },
        mocks: {},
        action: publicKeyActions.showXpub,
        result: {
            actions: [
                { type: connectInitThunk.pending.type, payload: undefined },
                { type: connectInitThunk.fulfilled.type, payload: undefined },
            ],
        },
    },
    {
        description: 'Show public key, @trezor/connect error',
        initialState: undefined,
        mocks: {
            getPublicKey: { success: false, error: { message: 'Runtime error' } },
        },
        action: publicKeyActions.showXpub,
        result: {
            actions: [
                { type: connectInitThunk.pending.type, payload: undefined },
                { type: connectInitThunk.fulfilled.type, payload: undefined },
                { type: MODAL.PRESERVE },
                { type: LOCK_DEVICE },
                { type: LOCK_DEVICE },
                { type: '@suite/device/removeButtonRequests' },

                { type: MODAL.CLOSE },
                {
                    type: notificationsActions.addToast.type,
                    payload: { type: 'verify-xpub-error', error: 'Runtime error' },
                },
            ],
        },
    },
    {
        description: 'Show public key, @trezor/connect permissions not granted',
        initialState: undefined,
        mocks: {
            getPublicKey: {
                success: false,
                error: { message: 'Runtime error', code: 'Method_PermissionsNotGranted' },
            },
        },
        action: publicKeyActions.showXpub,
        result: {
            actions: [
                { type: connectInitThunk.pending.type, payload: undefined },
                { type: connectInitThunk.fulfilled.type, payload: undefined },
                { type: MODAL.PRESERVE },
                { type: LOCK_DEVICE },
                { type: LOCK_DEVICE },
                { type: '@suite/device/removeButtonRequests' },

                { type: MODAL.CLOSE },
            ],
        },
    },
];
