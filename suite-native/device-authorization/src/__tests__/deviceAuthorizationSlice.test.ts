import { UI } from '@trezor/connect';
import { createDeviceInstanceThunk } from '@suite-common/wallet-core';

import {
    deviceAuthorizationInitialState,
    deviceAuthorizationReducer,
    DeviceAuthorizationState,
} from '../deviceAuthorizationSlice';
import {
    cancelPassphraseAndSelectStandardDeviceThunk,
    retryPassphraseAuthenticationThunk,
    verifyPassphraseOnEmptyWalletThunk,
} from '../passphraseThunks';

describe('deviceAuthorizationSlice', () => {
    const getDeviceAuthorizationState = (
        partialState: Partial<DeviceAuthorizationState>,
    ): DeviceAuthorizationState => ({ ...deviceAuthorizationInitialState, ...partialState });

    describe('initial state', () => {
        it('should have correct initial state', () => {
            expect(deviceAuthorizationReducer(undefined, { type: 'unknown' })).toEqual({
                hasDeviceRequestedPin: false,
                hasDeviceRequestedPassphrase: false,
                passphraseError: null,
                isVerifyingPassphraseOnEmptyWallet: false,
                isCreatingNewWalletInstance: false,
            });
        });
    });

    describe('UI.REQUEST_PIN', () => {
        it('should set `hasDeviceRequestedPin`', () => {
            expect(deviceAuthorizationReducer(undefined, { type: UI.REQUEST_PIN })).toEqual({
                hasDeviceRequestedPin: true,
                hasDeviceRequestedPassphrase: false,
                passphraseError: null,
                isVerifyingPassphraseOnEmptyWallet: false,
                isCreatingNewWalletInstance: false,
            });
        });
    });
    describe('UI.REQUEST_PASSPHRASE', () => {
        it('should set hasDeviceRequestedPassphrase', () => {
            const prevState = getDeviceAuthorizationState({ hasDeviceRequestedPin: true });

            const state = deviceAuthorizationReducer(prevState, { type: UI.REQUEST_PASSPHRASE });

            expect(state).toEqual({
                hasDeviceRequestedPin: false,
                hasDeviceRequestedPassphrase: true,
                passphraseError: null,
                isVerifyingPassphraseOnEmptyWallet: false,
                isCreatingNewWalletInstance: false,
            });
        });
    });

    describe('UI.REQUEST_BUTTON', () => {
        it('should react to code `ButtonRequest_PinEntry`', () => {
            const prevState = getDeviceAuthorizationState({
                hasDeviceRequestedPin: true,
                hasDeviceRequestedPassphrase: true,
            });
            const action = { type: UI.REQUEST_BUTTON, payload: { code: 'ButtonRequest_PinEntry' } };

            const state = deviceAuthorizationReducer(prevState, action);

            expect(state).toEqual({
                hasDeviceRequestedPin: true,
                hasDeviceRequestedPassphrase: false,
                passphraseError: null,
                isVerifyingPassphraseOnEmptyWallet: false,
                isCreatingNewWalletInstance: false,
            });
        });

        it('should react to code  `PinMatrixRequestType_Current`', () => {
            const prevState = getDeviceAuthorizationState({
                hasDeviceRequestedPin: true,
                hasDeviceRequestedPassphrase: true,
            });
            const action = {
                type: UI.REQUEST_BUTTON,
                payload: { code: 'PinMatrixRequestType_Current' },
            };

            const state = deviceAuthorizationReducer(prevState, action);

            expect(state).toEqual({
                hasDeviceRequestedPin: true,
                hasDeviceRequestedPassphrase: false,
                passphraseError: null,
                isVerifyingPassphraseOnEmptyWallet: false,
                isCreatingNewWalletInstance: false,
            });
        });

        it('should react to code `ButtonRequest_Other`', () => {
            const prevState = getDeviceAuthorizationState({
                hasDeviceRequestedPin: true,
                hasDeviceRequestedPassphrase: true,
            });
            const action = {
                type: UI.REQUEST_BUTTON,
                payload: { code: 'ButtonRequest_Other' },
            };

            const state = deviceAuthorizationReducer(prevState, action);

            expect(state).toEqual({
                hasDeviceRequestedPin: false,
                hasDeviceRequestedPassphrase: true,
                passphraseError: null,
                isVerifyingPassphraseOnEmptyWallet: false,
                isCreatingNewWalletInstance: false,
            });
        });
    });

    describe('UI.CLOSE_UI_WINDOW', () => {
        it('should set correct state when `isCreatingNewWalletInstance` is `true`', () => {
            const prevState = getDeviceAuthorizationState({
                hasDeviceRequestedPin: true,
                hasDeviceRequestedPassphrase: true,
                isCreatingNewWalletInstance: true,
            });
            const action = { type: UI.CLOSE_UI_WINDOW };

            expect(deviceAuthorizationReducer(prevState, action)).toEqual({
                hasDeviceRequestedPin: false,
                hasDeviceRequestedPassphrase: true,
                passphraseError: null,
                isVerifyingPassphraseOnEmptyWallet: false,
                isCreatingNewWalletInstance: true,
            });
        });

        it('should set correct state when `isCreatingNewWalletInstance` is `false`', () => {
            const prevState = getDeviceAuthorizationState({
                hasDeviceRequestedPin: true,
                hasDeviceRequestedPassphrase: true,
                isCreatingNewWalletInstance: false,
            });
            const action = { type: UI.CLOSE_UI_WINDOW };

            expect(deviceAuthorizationReducer(prevState, action)).toEqual({
                hasDeviceRequestedPin: false,
                hasDeviceRequestedPassphrase: false,
                passphraseError: null,
                isVerifyingPassphraseOnEmptyWallet: false,
                isCreatingNewWalletInstance: false,
            });
        });
    });

    describe('verifyPassphraseOnEmptyWalletThunk', () => {
        it('on pending should set `isVerifyingPassphraseOnEmptyWallet`', () => {
            const prevState = getDeviceAuthorizationState({
                isVerifyingPassphraseOnEmptyWallet: false,
            });

            const action = { type: verifyPassphraseOnEmptyWalletThunk.pending.type };

            const state = deviceAuthorizationReducer(prevState, action);

            expect(state).toEqual({
                hasDeviceRequestedPin: false,
                hasDeviceRequestedPassphrase: false,
                passphraseError: null,
                isVerifyingPassphraseOnEmptyWallet: true,
                isCreatingNewWalletInstance: false,
            });
        });

        it('should set `isVerifyingPassphraseOnEmptyWallet` to `false` when resolved', () => {
            const prevState = getDeviceAuthorizationState({
                isVerifyingPassphraseOnEmptyWallet: true,
                isCreatingNewWalletInstance: true,
            });

            const action = { type: verifyPassphraseOnEmptyWalletThunk.fulfilled.type };

            const state = deviceAuthorizationReducer(prevState, action);

            expect(state).toEqual({
                hasDeviceRequestedPin: false,
                hasDeviceRequestedPassphrase: false,
                passphraseError: null,
                isVerifyingPassphraseOnEmptyWallet: false,
                isCreatingNewWalletInstance: false,
            });
        });

        it('should set `passphraseError` on rejection with error', () => {
            const prevState = getDeviceAuthorizationState({
                isVerifyingPassphraseOnEmptyWallet: true,
                isCreatingNewWalletInstance: true,
            });

            const action = {
                type: verifyPassphraseOnEmptyWalletThunk.rejected.type,
                payload: { error: 'no-device' },
            };

            const state = deviceAuthorizationReducer(prevState, action);

            expect(state).toEqual({
                hasDeviceRequestedPin: false,
                hasDeviceRequestedPassphrase: false,
                passphraseError: { error: 'no-device' },
                isVerifyingPassphraseOnEmptyWallet: true,
                isCreatingNewWalletInstance: true,
            });
        });

        it('should  set `isVerifyingPassphraseOnEmptyWallet` to `false` when resolved', () => {
            const prevState = getDeviceAuthorizationState({
                isVerifyingPassphraseOnEmptyWallet: true,
                isCreatingNewWalletInstance: true,
            });

            const action = { type: verifyPassphraseOnEmptyWalletThunk.rejected.type };

            const state = deviceAuthorizationReducer(prevState, action);

            expect(state).toEqual({
                hasDeviceRequestedPin: false,
                hasDeviceRequestedPassphrase: false,
                passphraseError: null,
                isVerifyingPassphraseOnEmptyWallet: false,
                isCreatingNewWalletInstance: false,
            });
        });
    });

    describe('cancelPassphraseAndSelectStandardDeviceThunk', () => {
        it('should reset state while pending', () => {
            const prevState = getDeviceAuthorizationState({
                isCreatingNewWalletInstance: true,
                hasDeviceRequestedPassphrase: true,
                passphraseError: { error: 'no-device' },
            });

            const action = { type: cancelPassphraseAndSelectStandardDeviceThunk.pending.type };

            const state = deviceAuthorizationReducer(prevState, action);

            expect(state).toEqual({
                hasDeviceRequestedPin: false,
                hasDeviceRequestedPassphrase: false,
                passphraseError: null,
                isVerifyingPassphraseOnEmptyWallet: false,
                isCreatingNewWalletInstance: false,
            });
        });
    });

    describe('retryPassphraseAuthenticationThunk', () => {
        it('should reset passphraseError while pending', () => {
            const prevState = getDeviceAuthorizationState({
                passphraseError: { error: 'no-device' },
            });

            const action = { type: retryPassphraseAuthenticationThunk.pending.type };

            const state = deviceAuthorizationReducer(prevState, action);

            expect(state).toEqual({
                hasDeviceRequestedPin: false,
                hasDeviceRequestedPassphrase: false,
                passphraseError: null,
                isVerifyingPassphraseOnEmptyWallet: false,
                isCreatingNewWalletInstance: false,
            });
        });
    });

    describe('createDeviceInstanceThunk', () => {
        it('should set `isCreatingNewWalletInstance` while pending', () => {
            const prevState = getDeviceAuthorizationState({
                isCreatingNewWalletInstance: false,
                passphraseError: { error: 'no-device' },
            });

            const action = { type: createDeviceInstanceThunk.pending.type };

            const state = deviceAuthorizationReducer(prevState, action);

            expect(state).toEqual({
                hasDeviceRequestedPin: false,
                hasDeviceRequestedPassphrase: false,
                passphraseError: null,
                isVerifyingPassphraseOnEmptyWallet: false,
                isCreatingNewWalletInstance: true,
            });
        });

        it('should set error on rejection', () => {
            const prevState = getDeviceAuthorizationState({
                isCreatingNewWalletInstance: true,
                hasDeviceRequestedPassphrase: true,
            });
            const action = {
                type: createDeviceInstanceThunk.rejected.type,
                payload: { error: 'auth-failed' },
            };

            const state = deviceAuthorizationReducer(prevState, action);

            expect(state).toEqual({
                hasDeviceRequestedPin: false,
                hasDeviceRequestedPassphrase: false,
                passphraseError: { error: 'auth-failed' },
                isVerifyingPassphraseOnEmptyWallet: false,
                isCreatingNewWalletInstance: false,
            });
        });
    });

    describe('authorizeDeviceThunk', () => {
        it('should set error on rejection', () => {
            const prevState = getDeviceAuthorizationState({
                isCreatingNewWalletInstance: true,
                hasDeviceRequestedPassphrase: true,
            });
            const action = {
                type: createDeviceInstanceThunk.rejected.type,
                payload: { error: 'auth-failed' },
            };

            const state = deviceAuthorizationReducer(prevState, action);

            expect(state).toEqual({
                hasDeviceRequestedPin: false,
                hasDeviceRequestedPassphrase: false,
                passphraseError: { error: 'auth-failed' },
                isVerifyingPassphraseOnEmptyWallet: false,
                isCreatingNewWalletInstance: false,
            });
        });
    });
});
