import { combineReducers } from '@reduxjs/toolkit';

import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { createTestStore } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import type { Bip43Path } from '@trezor/crypto-utils';

import { accountsActions } from './accountsActions';
import { prepareAccountsReducer } from './accountsReducer';
import { mockSetAccountAddMetadata } from '../../mocks';

const accountsReducer = prepareAccountsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    actions: { setAccountAddMetadata: mockSetAccountAddMetadata() },
    reducers: { storageLoadAccounts: mockReducer() },
});

const initStore = () =>
    createTestStore({
        extra: undefined,
        reducer: { wallet: combineReducers({ accounts: accountsReducer }) },
    });

const testBip43Path: Bip43Path = "m/84'/0'/0'";

// A descriptor containing '-' makes createAccountKey throw, embedding the confidential
// descriptor (xpub) in the thrown Error message. The '-' is the AccountKey separator; a
// malformed/malicious backend account-info response is the realistic trigger.
const CONFIDENTIAL_DESCRIPTOR = 'xpub-with-illegal-separator';

const createAccountAction = () =>
    accountsActions.createAccount({
        deviceState: '1stTestnetAddress@device_id:0',
        index: 0,
        path: testBip43Path,
        accountType: 'normal',
        symbol: asNetworkSymbol('btc'),
        accountInfo: {
            descriptor: CONFIDENTIAL_DESCRIPTOR,
            path: testBip43Path,
            empty: false,
            balance: '0',
            availableBalance: '0',
            tokens: [],
            history: { total: 0, transactions: [], unconfirmed: 0 },
        },
        visible: true,
    });

describe('accountsActions.createAccount confidential-data logging', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it('re-throws a generic error and never logs the confidential descriptor', () => {
        const store = initStore();

        expect(() => store.dispatch(createAccountAction())).toThrow(
            'Failed to create account payload',
        );

        // The catch must have run (payload construction failed on the illegal descriptor).
        expect(consoleErrorSpy).toHaveBeenCalled();

        // No logged argument (across any call) may contain the confidential descriptor —
        // console.error is forwarded to Sentry via captureConsoleIntegration on all platforms.
        // Serialize each arg the way Sentry does (Error message + stack are non-enumerable, so
        // JSON.stringify(error) would falsely report '{}' and miss the leak).
        const serializeLikeSentry = (arg: unknown): string =>
            arg instanceof Error
                ? `${arg.message}\n${arg.stack ?? ''}`
                : (JSON.stringify(arg ?? '') ?? String(arg));

        const loggedConfidential = consoleErrorSpy.mock.calls
            .flat()
            .some(arg => serializeLikeSentry(arg).includes(CONFIDENTIAL_DESCRIPTOR));

        expect(loggedConfidential).toBe(false);
    });
});
