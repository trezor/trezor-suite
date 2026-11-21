import '@suite-common/test-utils/globalOverrides';

import { IntlProvider } from 'react-intl';

import { type UnknownAction } from '@reduxjs/toolkit';
import { act } from '@testing-library/react';

import { selectedAccountReducer } from '@suite/account';
import { messages } from '@suite/intl';
import {
    MODAL_CONTEXT_DEVICE,
    MODAL_CONTEXT_USER,
    closeModal,
    modalReducer,
    openModal,
} from '@suite/modal';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { accountsActions, prepareStakeReducer, stakeActions } from '@suite-common/wallet-core';
import {
    type Account,
    type PrecomposedTransactionFinal,
    type SelectedAccountLoaded,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { UI_REQUESTS } from '@trezor/connect';
import { createDeferred } from '@trezor/utils';

import { signTransactionThunk } from '#src/actions/wallet/stakeActions';

import { useChangeDelegateForm } from './useChangeDelegateForm';
import { type MockSuiteState, mockInitialAppState } from '../../../mocks/mockInitialAppState';

const stakeReducer = prepareStakeReducer(undefined);
const mockSelectedAccount = (account: Account): SelectedAccountLoaded => ({
    status: 'loaded',
    account,
    network: getNetwork(account.symbol),
    params: {
        symbol: account.symbol,
        accountIndex: account.index,
        accountType: account.accountType,
    },
});

const mockComposedTransaction: PrecomposedTransactionFinal = {
    type: 'final',
    fee: '1',
    feePerByte: '1',
    bytes: 1,
    totalSpent: '1',
    max: undefined,
    inputs: [],
    outputs: [],
    outputsPermutation: [],
};

jest.mock('#src/actions/wallet/stakeActions', () => ({ signTransactionThunk: jest.fn() }));
jest.mock('#src/hooks/wallet/form/useStakeCompose', () => ({
    useStakeCompose: () => ({
        isLoading: false,
        hasComposeError: false,
        composedLevels: { normal: mockComposedTransaction },
        composeRequest: jest.fn(),
        onFeeLevelChange: jest.fn(),
    }),
}));
jest.mock('#src/hooks/wallet/form/useFees', () => ({
    useFees: () => ({ selectedFee: 'normal', changeFeeLevel: jest.fn() }),
}));

describe('change-delegate signing failures', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => jest.restoreAllMocks());

    it('recovers a change-delegate preparation failure', async () => {
        const symbol = 'ada';
        const account = mockWalletAccount({ symbol: asNetworkSymbol(symbol) });
        const { services } = createTestCompositionRoot<void, MockSuiteState>({
            reducer: (state: MockSuiteState = mockInitialAppState, action: UnknownAction) => ({
                ...state,
                modal: modalReducer(state.modal, action),
                wallet: {
                    ...state.wallet,
                    stake: stakeReducer(state.wallet.stake, action),
                    selectedAccount: selectedAccountReducer(state.wallet.selectedAccount, action),
                },
            }),
            preloadedState: {
                ...mockInitialAppState,
                wallet: {
                    ...mockInitialAppState.wallet,
                    selectedAccount: mockSelectedAccount(account),
                },
                modal: {
                    context: MODAL_CONTEXT_USER,
                    payload: { type: 'change-delegate' },
                    preserve: true,
                },
            },
        });
        const dispatch = jest.spyOn(services.store, 'dispatch');
        jest.mocked(signTransactionThunk).mockReturnValue(() =>
            Promise.reject(new Error('Sensitive account payload')),
        );
        const { result } = renderHookWithStoreProvider(
            () =>
                useChangeDelegateForm({
                    selectedAccount: {
                        status: 'loaded',
                        account,
                        network: getNetwork(account.symbol),
                        params: {
                            symbol: account.symbol,
                            accountIndex: account.index,
                            accountType: account.accountType,
                        },
                    },
                }),
            {
                services,
                wrapper: ({ children }) => <IntlProvider locale="en">{children}</IntlProvider>,
            },
        );

        act(() => {
            services.store.dispatch(
                stakeActions.requestSignTransaction({
                    accountKey: account.key,
                    formValues: result.current.getValues(),
                    transactionInfo: mockComposedTransaction,
                }),
            );
        });
        expect(services.store.getState().wallet.stake.accountKey).toBe(account.key);
        act(() => {
            services.store.dispatch(
                stakeActions.requestPushTransaction({
                    tx: 'qa-signed-transaction',
                    symbol: account.symbol,
                }),
            );
        });

        await act(async () => {
            await expect(result.current.signTx()).resolves.toBeUndefined();
        });

        expect(services.store.getState().wallet.stake.precomposedTx).toBeUndefined();
        expect(services.store.getState().wallet.stake.accountKey).toBeUndefined();
        expect(services.store.getState().modal).toMatchObject({
            context: MODAL_CONTEXT_USER,
            payload: { type: 'change-delegate' },
        });
        expect(services.store.getState().modal.preserve).toBeFalsy();

        expect(dispatch).toHaveBeenCalledWith(stakeActions.dispose());
        expect(services.store.getState().wallet.stake.serializedTx).toBeUndefined();
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: notificationsActions.addToast.type,
                payload: expect.objectContaining({
                    type: 'sign-tx-error',
                    error: messages.TR_STAKING_ERROR_GENERIC.defaultMessage,
                }),
            }),
        );
        expect(JSON.stringify(jest.mocked(console.warn).mock.calls)).not.toContain('Sensitive');

        jest.mocked(signTransactionThunk).mockReturnValue(() => Promise.resolve(undefined));
        await act(async () => {
            await result.current.signTx();
        });
        expect(signTransactionThunk).toHaveBeenCalledTimes(2);
    });

    it.each([
        'dismissed',
        'superseded',
        'another-modal',
        'reopened-form',
        'another-account',
        'another-review',
        'another-device',
    ] as const)('ignores a %s signing failure', async scenario => {
        const account = mockWalletAccount({ symbol: asNetworkSymbol('ada') });
        const { services } = createTestCompositionRoot<void, MockSuiteState>({
            reducer: (state: MockSuiteState = mockInitialAppState, action: UnknownAction) => ({
                ...state,
                modal: modalReducer(state.modal, action),
                wallet: {
                    ...state.wallet,
                    stake: stakeReducer(state.wallet.stake, action),
                    selectedAccount: selectedAccountReducer(state.wallet.selectedAccount, action),
                },
            }),
            preloadedState: {
                ...mockInitialAppState,
                wallet: {
                    ...mockInitialAppState.wallet,
                    selectedAccount: mockSelectedAccount(account),
                },
                modal: {
                    context: MODAL_CONTEXT_USER,
                    payload: { type: 'change-delegate' },
                    preserve: true,
                },
            },
        });
        const { result } = renderHookWithStoreProvider(
            () =>
                useChangeDelegateForm({
                    selectedAccount: {
                        status: 'loaded',
                        account,
                        network: getNetwork(account.symbol),
                        params: {
                            symbol: account.symbol,
                            accountIndex: account.index,
                            accountType: account.accountType,
                        },
                    },
                }),
            {
                services,
                wrapper: ({ children }) => <IntlProvider locale="en">{children}</IntlProvider>,
            },
        );
        const deferred = createDeferred<undefined>();
        jest.mocked(signTransactionThunk).mockReturnValue(() => deferred.promise);
        const dispatch = jest.spyOn(services.store, 'dispatch');
        const signParams = {
            accountKey: account.key,
            formValues: result.current.getValues(),
            transactionInfo: mockComposedTransaction,
        };
        act(() => services.store.dispatch(stakeActions.requestSignTransaction(signParams)));
        await act(async () => {
            const signing = result.current.signTx();
            if (scenario === 'superseded') {
                services.store.dispatch(stakeActions.requestSignTransaction(signParams));
                services.store.dispatch(
                    stakeActions.requestPushTransaction({
                        tx: 'new-qa-signed-transaction',
                        symbol: account.symbol,
                    }),
                );
            } else if (scenario === 'another-account') {
                const otherAccount = mockWalletAccount({
                    symbol: asNetworkSymbol('ada'),
                    descriptor: asAccountDescriptor('otherAccount'),
                });
                expect(otherAccount.key).not.toBe(account.key);
                services.store.dispatch(
                    accountsActions.updateSelectedAccount(mockSelectedAccount(otherAccount)),
                );
            } else if (scenario === 'another-device') {
                services.store.dispatch(closeModal());
                services.store.dispatch({
                    type: UI_REQUESTS.REQUEST_PIN,
                    payload: { device: mockSuiteDevice() },
                });
            } else if (scenario === 'another-review') {
                services.store.dispatch(closeModal());
                services.store.dispatch(
                    openModal({ type: 'review-transaction', decision: createDeferred<boolean>() }),
                );
            } else {
                services.store.dispatch(closeModal());
                services.store.dispatch(
                    openModal(
                        scenario === 'reopened-form'
                            ? { type: 'change-delegate' }
                            : { type: 'application-log' },
                    ),
                );
                if (scenario === 'dismissed') services.store.dispatch(stakeActions.dispose());
            }
            const newerModal = services.store.getState().modal;
            if (scenario === 'another-device')
                expect(newerModal).toMatchObject({ context: MODAL_CONTEXT_DEVICE });
            if (scenario === 'another-review')
                expect(newerModal).toMatchObject({
                    context: MODAL_CONTEXT_USER,
                    payload: { type: 'review-transaction' },
                });
            const newerStake = services.store.getState().wallet.stake;
            dispatch.mockClear();
            deferred.reject(new Error('Sensitive account payload'));
            await signing;
            expect(services.store.getState().modal).toBe(newerModal);
            if (scenario === 'dismissed' || scenario === 'superseded')
                expect(services.store.getState().wallet.stake).toBe(newerStake);
            else expect(services.store.getState().wallet.stake.precomposedTx).toBeUndefined();
        });
        expect(
            dispatch.mock.calls.some(
                ([action]) =>
                    typeof action !== 'function' && notificationsActions.addToast.match(action),
            ),
        ).toBe(false);
    });
});
