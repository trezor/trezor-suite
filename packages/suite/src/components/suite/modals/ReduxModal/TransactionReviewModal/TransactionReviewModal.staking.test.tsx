import { act, fireEvent, screen, waitFor } from '@testing-library/react';

import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { prepareDesktopDeviceReducer } from '@suite/device';
import { MODAL_OPEN_USER_CONTEXT, modalReducer } from '@suite/modal';
import { mockStakingQueryClient } from '@suite-common/earn-staking/mocks';
import { mockGetAccountSyncInterval } from '@suite-common/networks/mocks';
import { mockGetIsWindowVisible, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getStakeFormsDefaultValues } from '@suite-common/wallet-core';
import { type PrecomposedTransactionFinal, type StakeFormState } from '@suite-common/wallet-types';
import { mockGetTradedAccountKeys, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect, { UI_EVENTS } from '@trezor/connect';
import { createDeferred } from '@trezor/utils';

import {
    type SignTransactionThunkDeps,
    signTransactionThunk as signStakeTransactionThunk,
} from '#src/actions/wallet/stakeActions';
import { createWalletReducer } from '#src/reducers/wallet/walletReducer';
import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { TransactionReviewModal } from './TransactionReviewModal';
import { mockExtraDependenciesForReducers } from '../../../../../../mocks/mockExtraDependenciesForReducers';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../mocks/mockInitialAppState';

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    prepareSolanaStakeTxData: () =>
        Promise.resolve({ success: true, txShim: { serializeMessage: () => 'test-message' } }),
    selectBlockchainUrlBySymbol: () => 'https://example.com',
}));

jest.mock('./TransactionReviewModalBodyInner', () => ({
    TransactionReviewModalBodyInner: ({
        handleTryAgain,
    }: {
        handleTryAgain: (cancel: boolean) => void;
    }) => <button onClick={() => handleTryAgain(true)}>Retry signature</button>,
}));

const walletReducer = createWalletReducer(mockExtraDependenciesForReducers);
const deviceReducer = prepareDesktopDeviceReducer(mockExtraDependenciesForReducers);
const account = mockWalletAccount({ symbol: asNetworkSymbol('sol') });
const precomposedTx: PrecomposedTransactionFinal = {
    type: 'final',
    fee: '42',
    feePerByte: '1',
    bytes: 42,
    totalSpent: '142',
    inputs: [],
    outputs: [],
    outputsPermutation: [],
};
const precomposedForm: StakeFormState = {
    ...getStakeFormsDefaultValues({ address: account.descriptor, stakeType: 'stake' }),
    options: ['broadcast'],
    setMaxOutputId: undefined,
};

const setup = () => {
    const device = mockSuiteDevice({
        path: 'signing-device',
        connected: true,
        available: true,
        state: { staticSessionId: account.deviceState },
    });
    const initial: MockSuiteState = {
        ...mockInitialAppState,
        device: { ...mockInitialAppState.device, devices: [device], selectedDevice: device },
        wallet: {
            ...mockInitialAppState.wallet,
            accounts: [account],
            selectedAccount: {
                status: 'loading',
                loader: 'account-loading',
                account,
            },
        },
    };
    const { services } = createTestCompositionRoot<SignTransactionThunkDeps, MockSuiteState>({
        preloadedState: initial,
        reducer: (state = initial, action) => ({
            ...state,
            device: deviceReducer(state.device, action),
            wallet: walletReducer(state.wallet, action),
            modal: modalReducer(state.modal, action),
        }),
        services: () => ({
            analytics: mockDesktopAnalytics(),
            queryClient: mockStakingQueryClient(),
            getIsWindowVisible: mockGetIsWindowVisible(),
            getTradedAccountKeys: mockGetTradedAccountKeys(),
            networks: { getAccountSyncInterval: mockGetAccountSyncInterval() },
        }),
        serializableCheck: {
            ignoredActions: [MODAL_OPEN_USER_CONTEXT],
            ignoredPaths: ['modal'],
        },
    });
    const { store } = services;

    return { store, device, services };
};

it('cancels the pending Solana stake signature before verifying the device for a retry', async () => {
    const { store, device, services } = setup();
    const originalSignature =
        createDeferred<Awaited<ReturnType<typeof TrezorConnect.solanaSignTransaction>>>();
    const cancelled = {
        success: false,
        error: { code: 'Method_Cancel', message: 'tx-timeout' },
    } as const;
    const sign = jest
        .spyOn(TrezorConnect, 'solanaSignTransaction')
        .mockReturnValueOnce(originalSignature.promise)
        .mockResolvedValueOnce(cancelled);
    const cancel = jest.spyOn(TrezorConnect, 'cancel').mockImplementation(() => {});
    const verify = jest.spyOn(TrezorConnect, 'getDeviceState').mockResolvedValue({
        success: true,
        payload: { state: { staticSessionId: account.deviceState } },
    });

    try {
        const signing = store.dispatch(
            signStakeTransactionThunk({
                accountKey: account.key,
                device,
                formValues: precomposedForm,
                transactionInfo: { ...precomposedTx, createdTimestamp: Date.now() },
            }),
        );
        await waitFor(() => expect(sign).toHaveBeenCalledTimes(1));
        store.dispatch({
            type: UI_EVENTS.BUTTON_REQUEST,
            payload: { code: 'ButtonRequest_SignTx', device },
        });
        renderWithProviders(services, <TransactionReviewModal type="sign-transaction" />);

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Retry signature' }));
            await Promise.resolve();
        });
        expect(cancel).toHaveBeenCalledWith({ reason: 'tx-timeout' });
        expect(verify).not.toHaveBeenCalled();
        expect(sign).toHaveBeenCalledTimes(1);

        await act(async () => {
            store.dispatch({ type: UI_EVENTS.CLOSE_UI_WINDOW });
            originalSignature.resolve(cancelled);
            await signing;
        });

        await waitFor(() => expect(sign).toHaveBeenCalledTimes(2));
        expect(verify).toHaveBeenCalledTimes(1);
    } finally {
        sign.mockRestore();
        cancel.mockRestore();
        verify.mockRestore();
    }
});
