import { type DesktopAnalyticsDep } from '@suite/analytics';
import {
    MODAL_OPEN_USER_CONTEXT,
    modalReducer,
    type openDeferredModal,
    selectUserContextModalPayload,
} from '@suite/modal';
import {
    USER_CANCELLED_ERROR_CODES,
    buildClaimTransactionReview,
} from '@suite-common/earn-stablecoin';
import { mockGetAccountSyncInterval } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type EthereumGetCurrentNonceThunkState, yieldActions } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import { TrezorBlockchain } from '@trezor/blockchain-core';
import TrezorConnect, { type DeviceUniquePath } from '@trezor/connect';
import { asGetter } from '@trezor/dependency-injection';

import { claimMerklRewardsThunk } from './claimMerklRewardsThunk';
import { type SendYieldTransactionDeps, type SendYieldTransactionState } from './signingHelpers';

const mockOpenSimulation = jest.fn();
const mockEstimateYieldFeeLevel = jest.fn();
const mockDevice = mockSuiteDevice({
    path: 'owner',
    connected: true,
    available: true,
    state: { staticSessionId: 'mock@device:0' },
});

type ClaimMerklRewardsThunkDeps = SendYieldTransactionDeps & { services: DesktopAnalyticsDep };
type ClaimMerklRewardsThunkState = SendYieldTransactionState & EthereumGetCurrentNonceThunkState;

jest.mock('@suite/modal', () => {
    const actual = jest.requireActual<{ openDeferredModal: typeof openDeferredModal }>(
        '@suite/modal',
    );

    return {
        ...actual,
        openDeferredModal: (
            payload: { type: string },
            disconnect: { devicePath: DeviceUniquePath },
        ) =>
            payload.type === 'earn-yield-tx-simulation'
                ? mockOpenSimulation()
                : actual.openDeferredModal(
                      { type: 'review-transaction' },
                      { devicePath: disconnect.devicePath, cancelWith: false },
                  ),
    };
});

jest.mock('@suite-common/earn-stablecoin', () => ({
    ...jest.requireActual('@suite-common/earn-stablecoin'),
    buildClaimCalldata: () => '0xclaimdata',
    buildUnsignedClaimTransaction: () => '{}',
    buildClaimTransactionReview: jest.fn(() => ({
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
    })),
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

const dispatchClaim = (report: jest.Mock, isReviewModalConfirmed = true) => {
    const { store } = createTestCompositionRoot<
        ClaimMerklRewardsThunkDeps,
        ClaimMerklRewardsThunkState
    >({
        preloadedState: {},
        reducer: (state, action) => ({
            ...state!,
            modal: modalReducer(state?.modal, action),
        }),
        serializableCheck: {
            ignoredActions: [MODAL_OPEN_USER_CONTEXT],
            ignoredPaths: ['modal'],
        },
        services: () => ({
            analytics: mockAnalytics(report),
            networks: { getAccountSyncInterval: mockGetAccountSyncInterval() },
            getIsWindowVisible: asGetter(() => true),
            getTradedAccountKeys: asGetter(() => []),
        }),
    }).services;

    const unsubscribe = store.subscribe(() => {
        const modal = selectUserContextModalPayload(store.getState());
        if (modal?.type === 'review-transaction') {
            unsubscribe();
            modal.decision.resolve(isReviewModalConfirmed);
        }
    });

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
        mockOpenSimulation.mockReturnValue(() =>
            Promise.resolve({
                value: true,
                resolve: jest.fn(),
                selectedFee: null,
                selectedFeeLevel: 'normal',
            }),
        );
        jest.spyOn(TrezorConnect, 'ethereumSignTransaction').mockResolvedValue({
            success: true,
            payload: { v: '0x1', r: '0x2', s: '0x3', serializedTx: '0xsigned' },
        });
        jest.spyOn(TrezorBlockchain, 'pushTransaction').mockResolvedValue({
            success: true,
            payload: { txid: '0xclaim' },
        });
    });

    it('passes the selected fee level from simulation to the claim review', async () => {
        mockOpenSimulation.mockReturnValue(() =>
            Promise.resolve({
                value: true,
                resolve: jest.fn(),
                selectedFee: null,
                selectedFeeLevel: 'low',
            }),
        );

        await dispatchClaim(jest.fn());

        expect(buildClaimTransactionReview).toHaveBeenCalledWith(
            expect.objectContaining({ selectedFee: null, selectedFeeLevel: 'low' }),
        );
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
        const { result } = await dispatchClaim(report, false);

        expect(result).toBeNull();
        expect(report).not.toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({ type: 'error' }),
            }),
        );
        expect(TrezorBlockchain.pushTransaction).not.toHaveBeenCalled();
    });

    it('aborts without reporting when the simulation modal is torn down', async () => {
        const report = jest.fn();
        mockOpenSimulation.mockReturnValue(() => Promise.resolve(undefined));

        await dispatchClaim(report);

        expect(report).not.toHaveBeenCalled();
    });

    it('closes the approved claim review if broadcasting rejects', async () => {
        jest.spyOn(TrezorBlockchain, 'pushTransaction').mockRejectedValueOnce(
            new Error('Transport unavailable'),
        );

        const { store } = await dispatchClaim(jest.fn());

        expect(TrezorBlockchain.pushTransaction).toHaveBeenCalledTimes(1);
        expect(selectUserContextModalPayload(store.getState())).toBeUndefined();
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
