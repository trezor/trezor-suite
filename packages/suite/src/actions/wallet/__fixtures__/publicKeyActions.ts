import { connectInitThunk } from '@suite-common/connect-init';
import { testMocks } from '@suite-common/test-utils';
import { notificationsActions } from '@suite-common/toast-notifications';

import * as publicKeyActions from 'src/actions/wallet/publicKeyActions';
import { MODAL } from 'src/actions/suite/constants';

const { getSuiteDevice } = testMocks;

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
                { type: MODAL.OPEN_USER_CONTEXT },
            ],
        },
    },
    {
        description: 'Show public key failed, @trezor/connect method not specified',
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
                selectedDevice: getSuiteDevice({ connected: false }),
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
            getPublicKey: { success: false, payload: { error: 'Runtime error' } },
        },
        action: publicKeyActions.showXpub,
        result: {
            actions: [
                { type: connectInitThunk.pending.type, payload: undefined },
                { type: connectInitThunk.fulfilled.type, payload: undefined },
                { type: MODAL.PRESERVE },
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
                payload: { error: 'Runtime error', code: 'Method_PermissionsNotGranted' },
            },
        },
        action: publicKeyActions.showXpub,
        result: {
            actions: [
                { type: connectInitThunk.pending.type, payload: undefined },
                { type: connectInitThunk.fulfilled.type, payload: undefined },
                { type: MODAL.PRESERVE },
                { type: MODAL.CLOSE },
            ],
        },
    },
];
