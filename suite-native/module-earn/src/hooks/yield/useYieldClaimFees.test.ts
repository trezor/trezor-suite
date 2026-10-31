import { combineReducers } from '@reduxjs/toolkit';

import { buildClaimCalldata } from '@suite-common/earn-stablecoin';
import {
    estimateYieldFeeLevel,
    feesActions,
    feesReducer,
    formDraftReducer,
} from '@suite-common/wallet-core';
import { type FeesState, type PrecomposedLevels } from '@suite-common/wallet-types';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import {
    prepareSendFormReducer,
    transactionManagementActions,
} from '@suite-native/transaction-management';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { useYieldClaimFees } from './useYieldClaimFees';
import { type StablecoinYieldAccountRewards } from '../../utils/yield/stablecoinYieldClaimSummaryUtils';
import { buildYieldClaimFeeLevels, getYieldClaimFee } from '../../utils/yield/yieldClaimFeeUtils';

const mockGetCurrentNonce = jest.fn<Promise<{ nonce: string }>, []>();

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    estimateYieldFeeLevel: jest.fn(),
    ethereumGetCurrentNonceThunk: jest.fn(() => () => ({
        unwrap: () => mockGetCurrentNonce(),
    })),
}));

jest.mock('@suite-common/earn-stablecoin', () => ({
    ...jest.requireActual('@suite-common/earn-stablecoin'),
    buildClaimCalldata: jest.fn(),
    buildUnsignedClaimTransaction: jest.fn(() => ({ type: 'unsigned-claim-transaction' })),
}));

jest.mock('../../utils/yield/yieldClaimFeeUtils', () => ({
    buildYieldClaimFeeLevels: jest.fn(),
    getYieldClaimFee: jest.fn(),
}));

const estimateYieldFeeLevelMock = jest.mocked(estimateYieldFeeLevel);
const buildClaimCalldataMock = jest.mocked(buildClaimCalldata);
const buildYieldClaimFeeLevelsMock = jest.mocked(buildYieldClaimFeeLevels);
const getYieldClaimFeeMock = jest.mocked(getYieldClaimFee);

const FEE_LEVELS = {
    normal: {
        type: 'final',
        fee: '21000000',
        feeLimit: '21000',
        feePerByte: '10',
        totalSpent: '21000000',
        bytes: 0,
        inputs: [],
        outputs: [],
        outputsPermutation: [],
    },
} satisfies PrecomposedLevels;

const FEES_STATE = {
    eth: {
        status: 'loaded',
        data: {
            blockHeight: 100,
            blockTime: 12,
            minFee: 1,
            maxFee: 100,
            minPriorityFee: 1,
            levels: [{ label: 'normal', feePerUnit: '10', blocks: 1 }],
        },
    },
} as unknown as FeesState;

const ACCOUNT = {
    key: 'account-key',
    symbol: 'eth',
    networkType: 'ethereum',
    descriptor: '0xSenderAddress',
    deviceState: 'device-state',
    availableBalance: '1000000000000000000',
} as unknown as StablecoinYieldAccountRewards['account'];

const createAccountRewards = (amount = '100') =>
    ({
        account: ACCOUNT,
        rewards: [{ amount, proofs: [], token: { address: '0xToken', symbol: 'TKN' } }],
        totalFiatClaimableAmount: '1',
    }) as unknown as StablecoinYieldAccountRewards;

type HookProps = {
    accountRewards: StablecoinYieldAccountRewards | null;
    isEnabled: boolean;
};

const createTestStore = (fees: FeesState = FEES_STATE) =>
    createLightStore({
        reducer: {
            // Static slices required by the test store provider (formatters config).
            discreetMode: createStaticReducer({ isActive: false }),
            locale: createStaticReducer({ systemLocaleCode: 'en', appLocaleCode: 'system' }),
            wallet: combineReducers({
                settings: createStaticReducer({
                    localCurrency: 'usd',
                    bitcoinAmountUnit: 0,
                    addressDisplayType: 'chunked',
                }),
                fees: feesReducer,
                formDrafts: formDraftReducer,
                send: prepareSendFormReducer({
                    actionTypes: { storageLoad: mockActionType('storageLoad') },
                    reducers: { storageLoadFormDrafts: mockReducer() },
                }),
            }),
        },
        preloadedState: { wallet: { fees } },
    });

const renderYieldClaimFees = async (initialProps: HookProps, fees: FeesState = FEES_STATE) => {
    const store = createTestStore(fees);

    return {
        store,
        ...(await renderHookWithStoreProvider((props: HookProps) => useYieldClaimFees(props), {
            services: { store, analytics: mockNativeAnalytics() },
            initialProps,
        })),
    };
};

/** Fires the fee preparation debounce (300 ms) and lets the pending promises settle. */
const settleDebounce = () => act(() => jest.advanceTimersByTimeAsync(300));

describe('useYieldClaimFees', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockGetCurrentNonce.mockResolvedValue({ nonce: '5' });
        estimateYieldFeeLevelMock.mockResolvedValue({
            success: true,
            payload: { feeLimit: '21000' },
        } as unknown as Awaited<ReturnType<typeof estimateYieldFeeLevel>>);
        buildClaimCalldataMock.mockImplementation(
            ({ rewards }) =>
                `0xcalldata-${rewards.map(reward => reward.amount).join('-')}` as ReturnType<
                    typeof buildClaimCalldata
                >,
        );
        buildYieldClaimFeeLevelsMock.mockReturnValue(FEE_LEVELS);
        getYieldClaimFeeMock.mockReturnValue({
            gasLimit: '21000',
            maxFeePerGas: '10',
            maxPriorityFeePerGas: '1',
        } as ReturnType<typeof getYieldClaimFee>);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    it('does not show a previous flow fee before the current claim is prepared', async () => {
        const store = createTestStore();
        store.dispatch(
            transactionManagementActions.storeFeeLevels({
                feeLevels: {
                    normal: { ...FEE_LEVELS.normal!, fee: '999' },
                },
            }),
        );
        const { result } = await renderHookWithStoreProvider(useYieldClaimFees, {
            initialProps: { accountRewards: createAccountRewards(), isEnabled: true },
            services: { store, analytics: mockNativeAnalytics() },
        });
        expect(result.current.feePreview).toBeNull();
        expect(result.current.preparedAction).toBeNull();
        await settleDebounce();
        expect(result.current.feePreview).toEqual(FEE_LEVELS.normal);
    });

    it('prepares the claim fee', async () => {
        const { result } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });

        expect(result.current.isPreparingClaimFee).toBe(true);

        await settleDebounce();

        expect(estimateYieldFeeLevelMock).toHaveBeenCalledTimes(1);
        expect(result.current.isPreparingClaimFee).toBe(false);
        expect(result.current.preparedAction).not.toBeNull();
    });

    it.each([{}, { eth: { status: 'error' } }] as FeesState[])(
        'offers retry after an initial network-fee fetch leaves missing data: %j',
        async fees => {
            buildYieldClaimFeeLevelsMock.mockImplementation(
                jest.requireActual('../../utils/yield/yieldClaimFeeUtils').buildYieldClaimFeeLevels,
            );
            const { result, store } = await renderYieldClaimFees(
                {
                    accountRewards: createAccountRewards(),
                    isEnabled: true,
                },
                fees,
            );
            await settleDebounce();
            expect(result.current.preparedAction).toBeNull();
            expect(result.current.hasFeeEstimationError).toBe(true);
            await act(() => {
                store.dispatch(feesActions.updateMultipleFees(FEES_STATE));
                result.current.retryFeeEstimation();
            });
            await settleDebounce();
            expect(result.current.hasFeeEstimationError).toBe(false);
            expect(result.current.preparedAction).not.toBeNull();
        },
    );

    it('offers retry for unknown errors returned by the fee calculator', async () => {
        buildYieldClaimFeeLevelsMock.mockReturnValueOnce({
            normal: { type: 'error', error: 'TR_GENERIC_ERROR_TITLE' },
        });
        const { result } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });
        await settleDebounce();
        expect(result.current.hasFeeEstimationError).toBe(true);
        expect(result.current.preparedAction).toBeNull();
    });

    it('offers retry when nonce preparation fails and recovers without leaving the form', async () => {
        mockGetCurrentNonce.mockRejectedValueOnce(new Error('Backend unavailable'));
        const { result } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });

        await settleDebounce();

        expect(result.current.isPreparingClaimFee).toBe(false);
        expect(result.current.preparedAction).toBeNull();
        expect(result.current.hasFeeEstimationError).toBe(true);

        await act(() => result.current.retryFeeEstimation());
        await settleDebounce();

        expect(result.current.hasFeeEstimationError).toBe(false);
        expect(result.current.preparedAction).not.toBeNull();
    });

    it('offers retry when the fee estimation request rejects', async () => {
        estimateYieldFeeLevelMock.mockRejectedValueOnce(new Error('Backend unavailable'));
        const { result } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });

        await settleDebounce();

        expect(result.current.isPreparingClaimFee).toBe(false);
        expect(result.current.preparedAction).toBeNull();
        expect(result.current.hasFeeEstimationError).toBe(true);
    });

    it('does not re-prepare when rewards only get a new identity with unchanged values', async () => {
        const { result, rerender } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });

        await settleDebounce();

        const { preparedAction } = result.current;

        // A new deep-equal object, as produced by e.g. an unrelated fiat rates update.
        await rerender({ accountRewards: createAccountRewards(), isEnabled: true });

        expect(result.current.isPreparingClaimFee).toBe(false);
        expect(result.current.preparedAction).toBe(preparedAction);

        await settleDebounce();

        expect(estimateYieldFeeLevelMock).toHaveBeenCalledTimes(1);
        expect(result.current.preparedAction).toBe(preparedAction);
    });

    it('recovers after a balance-only top-up and blocks again if fee funds are spent', async () => {
        buildYieldClaimFeeLevelsMock.mockImplementation(
            jest.requireActual('../../utils/yield/yieldClaimFeeUtils').buildYieldClaimFeeLevels,
        );
        const rewards = createAccountRewards();
        const withBalance = (availableBalance: string) => ({
            ...rewards,
            account: { ...rewards.account, availableBalance },
        });
        const { result, rerender } = await renderYieldClaimFees({
            accountRewards: withBalance('0'),
            isEnabled: true,
        });
        await settleDebounce();
        expect(result.current.preparedAction).toBeNull();
        expect(result.current.isFeeUnavailable).toBe(true);
        expect(result.current.hasFeeEstimationError).toBe(false);

        await rerender({ accountRewards: withBalance(ACCOUNT.availableBalance), isEnabled: true });
        await settleDebounce();
        expect(result.current.isFeeUnavailable).toBe(false);
        expect(result.current.preparedAction).not.toBeNull();

        await rerender({ accountRewards: withBalance('0'), isEnabled: true });
        await settleDebounce();
        expect(result.current.preparedAction).toBeNull();
        expect(result.current.isFeeUnavailable).toBe(true);
        expect(estimateYieldFeeLevelMock).toHaveBeenCalledTimes(3);
    });

    it('does not re-prepare when identical network fee data is reloaded', async () => {
        const { result, store } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });
        await settleDebounce();
        const { preparedAction } = result.current;

        await act(() =>
            store.dispatch(
                feesActions.updateMultipleFees({
                    eth: {
                        ...FEES_STATE.eth!,
                        data: {
                            ...FEES_STATE.eth!.data!,
                            levels: FEES_STATE.eth!.data!.levels.map(level => ({ ...level })),
                        },
                    },
                }),
            ),
        );
        await settleDebounce();

        expect(estimateYieldFeeLevelMock).toHaveBeenCalledTimes(1);
        expect(result.current.preparedAction).toBe(preparedAction);
    });

    it('reprices when network rates change within the same block', async () => {
        buildYieldClaimFeeLevelsMock.mockImplementation(
            jest.requireActual('../../utils/yield/yieldClaimFeeUtils').buildYieldClaimFeeLevels,
        );
        const { result, store } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });
        await settleDebounce();
        const initialFee = result.current.preparedAction?.feePreview.fee;
        expect(initialFee).toBeDefined();

        await act(() =>
            store.dispatch(
                feesActions.updateMultipleFees({
                    eth: {
                        ...FEES_STATE.eth!,
                        data: {
                            ...FEES_STATE.eth!.data!,
                            levels: [{ label: 'normal', feePerUnit: '20', blocks: 1 }],
                        },
                    },
                }),
            ),
        );
        await settleDebounce();

        expect(estimateYieldFeeLevelMock).toHaveBeenCalledTimes(2);
        expect(result.current.preparedAction?.feePreview.fee).not.toBe(initialFee);
    });

    it('re-prepares when the claim rewards actually change', async () => {
        const { result, rerender } = await renderYieldClaimFees({
            accountRewards: createAccountRewards(),
            isEnabled: true,
        });

        await settleDebounce();

        await rerender({ accountRewards: createAccountRewards('200'), isEnabled: true });

        expect(result.current.isPreparingClaimFee).toBe(true);

        await settleDebounce();

        expect(estimateYieldFeeLevelMock).toHaveBeenCalledTimes(2);
        expect(result.current.preparedAction).not.toBeNull();
    });
});
