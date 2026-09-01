import { combineReducers } from '@reduxjs/toolkit';

import { buildClaimCalldata } from '@suite-common/earn-stablecoin';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { estimateYieldFeeLevel, formDraftReducer } from '@suite-common/wallet-core';
import { type FeesState, type PrecomposedLevels } from '@suite-common/wallet-types';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { prepareSendFormReducer } from '@suite-native/transaction-management';

import { useYieldClaimFees } from './useYieldClaimFees';
import { type StablecoinYieldAccountRewards } from '../../utils/yield/stablecoinYieldClaimSummaryUtils';
import { buildYieldClaimFeeLevels, getYieldClaimFee } from '../../utils/yield/yieldClaimFeeUtils';

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    estimateYieldFeeLevel: jest.fn(),
    ethereumGetCurrentNonceThunk: jest.fn(() => () => ({
        unwrap: () => Promise.resolve({ nonce: '5' }),
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
    normal: { type: 'final', fee: '21000000', feeLimit: '21000' },
} as unknown as PrecomposedLevels;

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

const createTestStore = () =>
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
                fees: createStaticReducer(FEES_STATE),
                formDrafts: formDraftReducer,
                send: prepareSendFormReducer({
                    actionTypes: { storageLoad: mockActionType('storageLoad') },
                    reducers: { storageLoadFormDrafts: mockReducer() },
                }),
            }),
        },
    });

const renderYieldClaimFees = (initialProps: HookProps) =>
    renderHookWithStoreProvider((props: HookProps) => useYieldClaimFees(props), {
        store: createTestStore(),
        initialProps,
    });

/** Fires the fee preparation debounce (300 ms) and lets the pending promises settle. */
const settleDebounce = () => act(() => jest.advanceTimersByTimeAsync(300));

describe('useYieldClaimFees', () => {
    beforeEach(() => {
        jest.useFakeTimers();
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
