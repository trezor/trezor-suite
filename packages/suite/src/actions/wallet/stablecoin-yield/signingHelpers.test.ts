import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import {
    MODAL_OPEN_USER_CONTEXT,
    modalReducer,
    openDeferredModal,
    selectUserContextModalPayload,
} from '@suite/modal';
import { USER_CANCELLED_ERROR_CODES } from '@suite-common/earn-stablecoin';
import { mockGetAccountSyncInterval } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type EvmSelectedFee, type FeeLevelLabel } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { TrezorBlockchain } from '@trezor/blockchain-core';
import TrezorConnect, { asDeviceUniquePath } from '@trezor/connect';
import { asGetter } from '@trezor/dependency-injection';

import {
    type SendYieldTransactionDeps,
    type SendYieldTransactionState,
    openYieldSimulationThunk,
    sendYieldTransaction,
} from './signingHelpers';

const mockBuildStablecoinYieldTransactionReview = jest.fn();
const mockDevice = mockSuiteDevice({
    connected: true,
    available: true,
    state: { staticSessionId: 'wallet@device:0' },
});
jest.mock('@suite-common/earn-stablecoin', () => ({
    ...jest.requireActual('@suite-common/earn-stablecoin'),
    buildStablecoinYieldTransactionReview: (payload: unknown) =>
        mockBuildStablecoinYieldTransactionReview(payload),
}));

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectSelectedDevice: () => mockDevice,
}));

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectAddressDisplayType: () => 'original',
    selectIsMevProtectionEnabled: () => false,
    synchronizeSentTransactionThunk: () => () => Promise.resolve(),
}));

jest.mock('@suite-common/mev', () => ({
    selectIsMevProtectionFeatureEnabled: () => false,
}));

const account = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    deviceState: 'wallet@device:0',
}) as Account;

const createSigningStore = (isReviewModalConfirmed: boolean) => {
    const { store } = createTestCompositionRoot<
        SendYieldTransactionDeps,
        SendYieldTransactionState
    >({
        preloadedState: {},
        reducer: (state, action) => ({
            ...state!,
            modal: modalReducer(state?.modal, action),
        }),
        services: () => ({
            analytics: mockDesktopAnalytics(),
            networks: { getAccountSyncInterval: mockGetAccountSyncInterval() },
            getIsWindowVisible: asGetter(() => true),
            getTradedAccountKeys: asGetter(() => []),
        }),
        serializableCheck: {
            ignoredActions: [MODAL_OPEN_USER_CONTEXT],
            ignoredPaths: ['modal'],
        },
    }).services;

    const unsubscribe = store.subscribe(() => {
        const modal = selectUserContextModalPayload(store.getState());
        if (modal?.type === 'review-transaction') {
            unsubscribe();
            modal.decision.resolve(isReviewModalConfirmed);
        }
    });

    return store;
};

type SendTransactionParams = {
    isReviewModalConfirmed?: boolean;
    selectedFee?: EvmSelectedFee | null;
    selectedFeeLevel?: FeeLevelLabel;
    unsignedTransaction?: string;
    store?: ReturnType<typeof createSigningStore>;
    sourceAccount?: Account;
};

const sendTransaction = ({
    isReviewModalConfirmed = true,
    selectedFee = null,
    selectedFeeLevel = 'normal',
    unsignedTransaction = '{}',
    store = createSigningStore(isReviewModalConfirmed),
    sourceAccount = account,
}: SendTransactionParams = {}) =>
    sendYieldTransaction({
        account: sourceAccount,
        amount: '100',
        token: {
            networkSymbol: asNetworkSymbol('eth'),
            symbol: 'usdc',
            decimals: 6,
            contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        },
        unsignedTransaction,
        flowKey: 'flow-1',
        flowType: 'deposit',
        dispatch: store.dispatch,
        getState: store.getState,
        selectedFee,
        selectedFeeLevel,
    });

describe('sendYieldTransaction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockBuildStablecoinYieldTransactionReview.mockReturnValue({
            transactionForSigning: {
                to: '0xd63070114470f685b75B74D60EEc7c1113d33a3D',
                value: '0x0',
                data: '0x',
                chainId: 1,
                nonce: '0x1',
                gasLimit: '0x5208',
                gasPrice: '0x1',
            },
            formState: {},
            precomposedTransaction: { fee: '31500000000' },
        });
        jest.spyOn(TrezorConnect, 'ethereumSignTransaction').mockResolvedValue({
            success: true,
            payload: { v: '0x1', r: '0x2', s: '0x3', serializedTx: '0xsigned' },
        });
        jest.spyOn(TrezorBlockchain, 'pushTransaction').mockResolvedValue({
            success: true,
            payload: { txid: '0xtxid' },
        });
    });

    it('keeps an account from another wallet out of simulation and signing', async () => {
        const sourceAccount = { ...account, deviceState: 'another-wallet@device:0' } as const;
        const store = createSigningStore(false);
        const decision = await openYieldSimulationThunk(
            { flow: 'deposit', account: sourceAccount, unsignedTx: '{}' },
            mockDevice,
        )(store.dispatch, store.getState);
        expect(decision).toEqual({ value: false });
        expect(store.getActions()).toEqual([]);
        await expect(sendTransaction({ sourceAccount })).resolves.toEqual({
            status: 'cancelled',
            stage: 'signing',
        });
        expect(TrezorConnect.ethereumSignTransaction).not.toHaveBeenCalled();
    });

    it.each(['low', 'normal', 'high', 'custom'] as const)(
        'carries the selected %s fee from simulation into the transaction review',
        async selectedFeeLevel => {
            mockBuildStablecoinYieldTransactionReview.mockImplementationOnce(
                jest.requireActual('@suite-common/earn-stablecoin')
                    .buildStablecoinYieldTransactionReview,
            );
            const store = createSigningStore(false);

            await sendTransaction({
                store,
                selectedFeeLevel,
                selectedFee: {
                    type: 'legacy',
                    gasLimit: '0x5208',
                    gasPrice: '0x1',
                },
                unsignedTransaction: JSON.stringify({
                    from: '0x1111111111111111111111111111111111111111',
                    to: '0x2222222222222222222222222222222222222222',
                    data: '0x',
                    chainId: 1,
                    gasLimit: '0x5208',
                    nonce: '0x1',
                    gasPrice: '0x1',
                }),
            });

            expect(store.getActions()).toContainEqual(
                expect.objectContaining({
                    payload: expect.objectContaining({
                        precomposedForm: expect.objectContaining({ selectedFee: selectedFeeLevel }),
                    }),
                }),
            );
            expect(TrezorBlockchain.pushTransaction).not.toHaveBeenCalled();
        },
    );

    it.each([...USER_CANCELLED_ERROR_CODES])(
        'returns cancelled when signing fails with %s',
        async code => {
            jest.spyOn(TrezorConnect, 'ethereumSignTransaction').mockResolvedValue({
                success: false,
                error: { code, message: 'cancelled by user' },
            });

            await expect(sendTransaction()).resolves.toEqual({
                status: 'cancelled',
                stage: 'signing',
            });
        },
    );

    it('returns cancelled when the review modal is declined before broadcast', async () => {
        await expect(sendTransaction({ isReviewModalConfirmed: false })).resolves.toEqual({
            status: 'cancelled',
            stage: 'review',
        });
        expect(TrezorBlockchain.pushTransaction).not.toHaveBeenCalled();
    });

    it('throws with the connect code as cause for other signing failures', async () => {
        jest.spyOn(console, 'error').mockImplementation();
        jest.spyOn(TrezorConnect, 'ethereumSignTransaction').mockResolvedValue({
            success: false,
            error: { code: 'Failure_FirmwareError', message: 'firmware error' },
        });

        await expect(sendTransaction()).rejects.toMatchObject({
            cause: 'Failure_FirmwareError',
        });
    });

    it('closes the approved review if broadcasting rejects', async () => {
        jest.spyOn(console, 'error').mockImplementation();
        const store = createSigningStore(true);
        const error = new Error('Transport unavailable');
        jest.spyOn(TrezorBlockchain, 'pushTransaction').mockRejectedValueOnce(error);

        await expect(sendTransaction({ store })).rejects.toBe(error);

        expect(selectUserContextModalPayload(store.getState())).toBeUndefined();
    });

    it('leaves a replacement review open if the original broadcast rejects', async () => {
        jest.spyOn(console, 'error').mockImplementation();
        const store = createSigningStore(true);
        const error = new Error('Transport unavailable');
        let replacementDecision: Promise<boolean> | undefined;
        jest.spyOn(TrezorBlockchain, 'pushTransaction').mockImplementationOnce(() => {
            replacementDecision = store.dispatch(
                openDeferredModal(
                    { type: 'review-transaction' },
                    { devicePath: asDeviceUniquePath('another-device'), cancelWith: false },
                ),
            );

            return Promise.reject(error);
        });

        await expect(sendTransaction({ store })).rejects.toBe(error);

        const activeModal = selectUserContextModalPayload(store.getState());
        expect(replacementDecision).toBeDefined();
        expect(activeModal?.type === 'review-transaction' && activeModal.decision.promise).toBe(
            replacementDecision,
        );
    });

    it('returns sent with the txid and the precomposed fee after broadcast', async () => {
        await expect(sendTransaction()).resolves.toEqual({
            status: 'sent',
            txid: '0xtxid',
            fee: '31500000000',
        });
    });
});
