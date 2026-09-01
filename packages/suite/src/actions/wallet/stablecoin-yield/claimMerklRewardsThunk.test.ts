import { type DesktopAnalyticsDep } from '@suite/analytics';
import { asGetter } from '@suite-common/dependency-injection';
import { USER_CANCELLED_ERROR_CODES } from '@suite-common/earn-stablecoin';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestStore } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { yieldActions } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import TrezorConnect from '@trezor/connect';

import { claimMerklRewardsThunk } from './claimMerklRewardsThunk';
import { type SendYieldTransactionDeps } from './signingHelpers';

const mockOpenDeferredModal = jest.fn();
const mockEstimateYieldFeeLevel = jest.fn();
const mockDevice = mockSuiteDevice({
    connected: true,
    available: true,
    state: { staticSessionId: 'wallet@device:0' },
});

type ClaimMerklRewardsThunkDeps = SendYieldTransactionDeps & { services: DesktopAnalyticsDep };

const createExtra = (report: jest.Mock = jest.fn()): ClaimMerklRewardsThunkDeps => ({
    services: {
        analytics: mockAnalytics(report),
        getIsWindowVisible: asGetter(() => true),
        getTradedAccountKeys: asGetter(() => []),
    },
});

jest.mock('@suite/modal', () => ({
    preserveModal: () => ({ type: 'mock/preserveModal' }),
    closeModal: () => ({ type: 'mock/closeModal' }),
    openDeferredModal: (payload: unknown) => mockOpenDeferredModal(payload),
}));

jest.mock('@suite-common/earn-stablecoin', () => ({
    ...jest.requireActual('@suite-common/earn-stablecoin'),
    buildClaimCalldata: () => '0xclaimdata',
    buildUnsignedClaimTransaction: () => '{}',
    buildClaimTransactionReview: () => ({
        formState: {},
        precomposedTransaction: { fee: '777000000000' },
        availableRewards: [],
        transactionForSigning: {
            to: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
            value: '0x0',
            data: '0xclaimdata',
            chainId: 1,
            nonce: '0x5',
            gasLimit: '0x5208',
            gasPrice: '0x1',
        },
    }),
}));

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectSelectedDevice: () => mockDevice,
}));

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    estimateYieldFeeLevel: (payload: unknown) => mockEstimateYieldFeeLevel(payload),
    getYieldClaimRewardsSnapshot: () => [],
    selectAddressDisplayType: () => 'original',
    selectIsMevProtectionEnabled: () => false,
    synchronizeSentTransactionThunk: (payload: unknown) => () => Promise.resolve(payload),
}));

jest.mock('@suite-common/wallet-core/src/send/sendFormEthereumThunks', () => ({
    ethereumGetCurrentNonceThunk: jest.fn(() => () => {
        const result = { nonce: '5', confirmedNonce: '5' };

        return Object.assign(Promise.resolve(result), {
            unwrap: () => Promise.resolve(result),
        });
    }),
}));

jest.mock('@suite-common/mev', () => ({
    selectIsMevProtectionFeatureEnabled: () => false,
}));

const account = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    deviceState: 'mock@device:0',
}) as Account;

const rewards = [{}] as Parameters<typeof claimMerklRewardsThunk>[0]['rewards'];

const dispatchClaim = (report: jest.Mock) => {
    const store = createTestStore({ extra: createExtra(report), preloadedState: {} });

    return store
        .dispatch(claimMerklRewardsThunk({ account, flowKey: 'flow-1', rewards }))
        .unwrap()
        .then(result => ({ store, result }));
};

describe('claimMerklRewardsThunk', () => {
    beforeAll(() => {
        // The thunk logs every caught failure; the expected ones would clutter the test output.
        jest.spyOn(console, 'error').mockImplementation();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockEstimateYieldFeeLevel.mockResolvedValue({
            success: true,
            payload: { feeLimit: '21000', feePerUnit: '1' },
        });
        mockOpenDeferredModal.mockImplementation(
            (payload: { type: string }) => () =>
                payload.type === 'review-transaction'
                    ? Promise.resolve(true)
                    : Promise.resolve({ value: true, resolve: jest.fn(), selectedFee: null }),
        );
        jest.spyOn(TrezorConnect, 'ethereumSignTransaction').mockResolvedValue({
            success: true,
            payload: { v: '0x1', r: '0x2', s: '0x3', serializedTx: '0xsigned' },
        });
        jest.spyOn(TrezorConnect, 'pushTransaction').mockResolvedValue({
            success: true,
            payload: { txid: '0xclaim' },
        });
    });

    it.each([...USER_CANCELLED_ERROR_CODES])(
        'returns null without an error report when signing fails with %s',
        async code => {
            const report = jest.fn();
            jest.spyOn(TrezorConnect, 'ethereumSignTransaction').mockResolvedValue({
                success: false,
                error: { code, message: 'cancelled by user' },
            });

            const { store, result } = await dispatchClaim(report);

            expect(result).toBeNull();
            expect(report).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({ type: 'error' }),
                }),
            );
            expect(
                store.getActions().filter(action => action.type === yieldActions.setError.type),
            ).toHaveLength(0);
        },
    );

    it('returns null without an error report when the review modal is declined', async () => {
        const report = jest.fn();
        mockOpenDeferredModal.mockImplementation(
            (payload: { type: string }) => () =>
                payload.type === 'review-transaction'
                    ? Promise.resolve(false)
                    : Promise.resolve({ value: true, resolve: jest.fn(), selectedFee: null }),
        );

        const { result } = await dispatchClaim(report);

        expect(result).toBeNull();
        expect(report).not.toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({ type: 'error' }),
            }),
        );
        expect(TrezorConnect.pushTransaction).not.toHaveBeenCalled();
    });

    it('stores the pending claim with its fee and submission time', async () => {
        const { store, result } = await dispatchClaim(jest.fn());

        expect(result).toEqual({ txid: '0xclaim' });

        const pendingTxAction = store
            .getActions()
            .find(action => action.type === yieldActions.setPendingTx.type);

        expect(pendingTxAction?.payload).toMatchObject({
            flowType: 'claim',
            flowKey: 'flow-1',
            tx: {
                type: 'claim',
                txid: '0xclaim',
                amount: '',
                fee: '777000000000',
                submittedAt: expect.any(Number),
            },
        });
    });
});
