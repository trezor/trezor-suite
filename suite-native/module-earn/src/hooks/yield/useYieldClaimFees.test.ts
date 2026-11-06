import { combineReducers } from '@reduxjs/toolkit';

import { buildClaimCalldata } from '@suite-common/earn-stablecoin';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type StablecoinYieldAccountRewards,
    blockchainInitialState,
    estimateYieldFeeLevel,
    feesActions,
    feesReducer,
    formDraftReducer,
    getNewFeeInfo,
} from '@suite-common/wallet-core';
import {
    type FeesState,
    asAccountDescriptor,
    asBaseCurrencyAmount,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
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
import { BigNumber, createDeferred } from '@trezor/utils';

import { useYieldClaimFees } from './useYieldClaimFees';
import { updateEarnSelectedFeeLevelThunk } from '../earn/useComposeEarnFees';

const mockGetCurrentNonce = jest.fn<Promise<{ nonce: string; confirmedNonce: string }>, []>();

jest.mock('@suite-common/wallet-core/src/yield/utils/yieldFeeEstimation', () => ({
    estimateYieldFeeLevel: jest.fn(),
}));

jest.mock('@suite-common/wallet-core/src/send/sendFormEthereumThunks', () => ({
    ...jest.requireActual('@suite-common/wallet-core/src/send/sendFormEthereumThunks'),
    ethereumGetCurrentNonceThunk: () => () => ({ unwrap: () => mockGetCurrentNonce() }),
}));

jest.mock('@suite-common/wallet-core/src/fees/feesUtils', () => ({
    ...jest.requireActual('@suite-common/wallet-core/src/fees/feesUtils'),
    getNewFeeInfo: jest.fn(),
}));

const estimateFeeMock = jest.mocked(estimateYieldFeeLevel);
const fetchFeesMock = jest.mocked(getNewFeeInfo);
const estimatedFee = { success: true, payload: { feeLimit: '21000', feePerUnit: '1' } } as const;
const account = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor('0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3'),
    availableBalance: '1000000000000000000',
});
const feeInfo = {
    blockHeight: 100,
    blockTime: 12,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 1,
    levels: [
        {
            label: 'normal' as const,
            feePerUnit: '1000000000',
            maxFeePerGas: '2000000000',
            maxPriorityFeePerGas: '1000000000',
            blocks: 1,
        },
    ],
};
const initialFees: FeesState = { eth: { status: 'loaded', data: feeInfo } };
const createAccountRewards = (amount = '100'): StablecoinYieldAccountRewards => ({
    account,
    rewards: [
        {
            root: '0xd8f0361b28675e4ac82f066f7abdaaffaa6e0fbd418f60dca41ae70656edd18b',
            amount,
            claimed: '0',
            pending: '0',
            claimable: asBaseCurrencyAmount(new BigNumber(amount)),
            proofs: ['0xd8f0361b28675e4ac82f066f7abdaaffaa6e0fbd418f60dca41ae70656edd18b'],
            token: {
                address: '0x58D97B57BB95320F9a05dC918Aef65434969c2B2',
                symbol: 'TKN',
                chainId: 1,
                decimals: 18,
            },
            fiat: { amount: null, claimed: null, pending: null, claimable: null },
        },
    ],
    totalFiatClaimableAmount: asBaseCurrencyAmount(new BigNumber(1)),
});
type HookProps = Parameters<typeof useYieldClaimFees>[0];
const initialProps: HookProps = { accountRewards: createAccountRewards(), isEnabled: true };

const createTestStore = (fees: FeesState = initialFees) =>
    createLightStore({
        reducer: {
            discreetMode: createStaticReducer({ isActive: false }),
            locale: createStaticReducer({ systemLocaleCode: 'en', appLocaleCode: 'system' }),
            wallet: combineReducers({
                settings: createStaticReducer({
                    localCurrency: 'usd',
                    bitcoinAmountUnit: 0,
                    addressDisplayType: 'chunked',
                }),
                blockchain: createStaticReducer(blockchainInitialState),
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
const renderFees = async (props: HookProps = initialProps, fees = initialFees) => {
    const store = createTestStore(fees);

    return {
        store,
        ...(await renderHookWithStoreProvider(useYieldClaimFees, {
            initialProps: props,
            services: { store, analytics: mockNativeAnalytics() },
        })),
    };
};
const settle = () => act(() => jest.advanceTimersByTimeAsync(301));

describe('useYieldClaimFees with shared fee preparation', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        estimateFeeMock.mockResolvedValue(estimatedFee);
        mockGetCurrentNonce.mockResolvedValue({ nonce: '5', confirmedNonce: '5' });
        fetchFeesMock.mockResolvedValue(feeInfo);
    });
    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    it('prepares real claim calldata and the selected EIP-1559 fee for Review', async () => {
        const { result } = await renderFees();
        expect(result.current.isComposingFeeLevels).toBe(true);
        expect(result.current.preparedAction).toBeNull();
        await settle();
        expect(result.current.preparedAction?.unsignedTransaction).toMatchObject({
            data: buildClaimCalldata({
                senderAddress: account.descriptor,
                rewards: initialProps.accountRewards!.rewards,
            }),
            chainId: 1,
            nonce: '0x5',
            gasLimit: '21000',
            maxFeePerGas: '2000000000',
            maxPriorityFeePerGas: '1000000000',
        });
        expect(result.current.feePreview?.fee).toBe('42000000000000');
        expect(result.current.isComposingFeeLevels).toBe(false);
    });

    it.each(['balance', 'rewards', 'disabled'] as const)(
        'invalidates the prepared action on the first render after %s changes',
        async change => {
            const store = createTestStore();
            const observations: unknown[] = [];
            const { rerender } = await renderHookWithStoreProvider(
                (props: HookProps) => {
                    const fees = useYieldClaimFees(props);
                    observations.push(fees.preparedAction);

                    return fees;
                },
                { initialProps, services: { store, analytics: mockNativeAnalytics() } },
            );
            await settle();
            expect(observations.at(-1)).not.toBeNull();
            observations.length = 0;
            let rewards = initialProps.accountRewards;
            if (change === 'balance')
                rewards = { ...rewards!, account: { ...account, availableBalance: '0' } };
            if (change === 'rewards') rewards = createAccountRewards('200');
            await rerender({ accountRewards: rewards, isEnabled: change !== 'disabled' });
            expect(observations.length).toBeGreaterThan(0);
            expect(observations.every(value => value === null)).toBe(true);
        },
    );

    it('ignores an old success after the rewards change', async () => {
        const pending = createDeferred<Awaited<ReturnType<typeof estimateYieldFeeLevel>>>();
        estimateFeeMock.mockReturnValueOnce(pending.promise);
        const { result, rerender } = await renderFees();
        await settle();
        await rerender({ accountRewards: createAccountRewards('200'), isEnabled: true });
        await settle();
        const current = result.current.preparedAction;
        expect(current).not.toBeNull();
        expect(current?.rewards[0]?.amount).toBe('200');
        expect(current?.unsignedTransaction.data).toBe(
            buildClaimCalldata({
                senderAddress: account.descriptor,
                rewards: createAccountRewards('200').rewards,
            }),
        );
        await act(() =>
            pending.resolve({ success: true, payload: { feeLimit: '99999', feePerUnit: '1' } }),
        );
        expect(result.current.preparedAction).toBe(current);
        expect(result.current.formDraft?.estimatedFeeLimit).toBe('21000');
    });

    it('ignores an old rejection after the current claim recovers', async () => {
        const pending = createDeferred<Awaited<ReturnType<typeof estimateYieldFeeLevel>>>();
        estimateFeeMock.mockReturnValueOnce(pending.promise);
        const { result, rerender } = await renderFees();
        await settle();
        await rerender({ accountRewards: createAccountRewards('200'), isEnabled: true });
        await settle();
        const current = result.current.preparedAction;
        await act(() => pending.reject(new Error('Obsolete request')));
        expect(result.current.hasFeeEstimationError).toBe(false);
        expect(result.current.preparedAction).toBe(current);
    });

    it('removes the draft on unmount and ignores a pending response', async () => {
        const { result, store, rerender, unmount } = await renderFees();
        await settle();
        expect(result.current.formDraft).toBeDefined();
        const pending = createDeferred<Awaited<ReturnType<typeof estimateYieldFeeLevel>>>();
        estimateFeeMock.mockReturnValueOnce(pending.promise);
        await rerender({ accountRewards: createAccountRewards('200'), isEnabled: true });
        await settle();
        await unmount();
        await act(() => pending.resolve(estimatedFee));
        expect(store.getState().wallet.send.feeLevels).toEqual({});
        expect(store.getState().wallet.formDrafts).toEqual({});
    });

    it('does not clear fee levels owned by a newer flow on unmount', async () => {
        const { store, unmount } = await renderFees();
        await settle();
        const newerFeeLevels = {
            normal: { type: 'error' as const, error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' as const },
        };
        await act(() =>
            store.dispatch(
                transactionManagementActions.storeFeeLevels({ feeLevels: newerFeeLevels }),
            ),
        );
        await unmount();
        expect(store.getState().wallet.send.feeLevels).toEqual(newerFeeLevels);
    });

    it('waits for network rates before estimating gas', async () => {
        const pending = createDeferred<Awaited<ReturnType<typeof getNewFeeInfo>>>();
        fetchFeesMock.mockReturnValueOnce(pending.promise);
        const { result } = await renderFees(initialProps, { eth: { status: 'loading' } });
        await settle();
        expect(result.current.isComposingFeeLevels).toBe(true);
        expect(result.current.hasFeeEstimationError).toBe(false);
        expect(estimateFeeMock).not.toHaveBeenCalled();
        await act(() => pending.resolve(feeInfo));
        expect(result.current.preparedAction).not.toBeNull();
    });

    it.each([{}, { eth: { status: 'error' } }] as FeesState[])(
        'fetches missing rates again on retry without manually repairing the store: %j',
        async fees => {
            fetchFeesMock.mockResolvedValueOnce(undefined);
            const { result } = await renderFees(initialProps, fees);
            await settle();
            expect(result.current.hasFeeEstimationError).toBe(true);
            expect(result.current.preparedAction).toBeNull();
            expect(estimateFeeMock).not.toHaveBeenCalled();
            await act(() => result.current.retryFeeEstimation());
            await settle();
            expect(fetchFeesMock).toHaveBeenCalledTimes(2);
            expect(result.current.hasFeeEstimationError).toBe(false);
            expect(result.current.preparedAction).not.toBeNull();
        },
    );

    it.each(['gas', 'nonce'] as const)(
        'recovers from a failed %s request after retry',
        async failure => {
            if (failure === 'gas')
                estimateFeeMock.mockRejectedValueOnce(new Error('Backend unavailable'));
            else mockGetCurrentNonce.mockRejectedValueOnce(new Error('Backend unavailable'));
            const { result } = await renderFees();
            await settle();
            expect(result.current.hasFeeEstimationError).toBe(true);
            expect(result.current.preparedAction).toBeNull();
            await act(() => result.current.retryFeeEstimation());
            await settle();
            expect(result.current.hasFeeEstimationError).toBe(false);
            expect(result.current.preparedAction).not.toBeNull();
        },
    );

    it('reprices changed rates in the same block without repeating gas estimation', async () => {
        const { result, store } = await renderFees();
        await settle();
        await act(() =>
            store.dispatch(
                feesActions.updateMultipleFees({
                    eth: {
                        status: 'loaded',
                        data: {
                            ...feeInfo,
                            levels: [{ ...feeInfo.levels[0]!, maxFeePerGas: '4000000000' }],
                        },
                    },
                }),
            ),
        );
        expect(result.current.isComposingFeeLevels).toBe(false);
        expect(result.current.preparedAction?.unsignedTransaction).toMatchObject({
            maxFeePerGas: '4000000000',
        });
        expect(result.current.feePreview?.fee).toBe('84000000000000');
        await settle();
        expect(estimateFeeMock).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['21000', 'custom', '42000', '3000000000'],
        ['50000', 'normal', '50000', '4000000000'],
    ] as const)(
        'uses %s estimated gas to retain or reset Custom after a rewards change',
        async (gasLimit, selectedFee, selectedGasLimit, maxFeePerGas) => {
            const { result, store, rerender } = await renderFees();
            await settle();
            const custom = result.current.getCustomFeeLevel({
                label: 'custom',
                blocks: -1,
                feePerUnit: '3',
                feeLimit: '42000',
                maxFeePerGas: '3',
                maxPriorityFeePerGas: '1',
            });
            if (!isFinalPrecomposedTransaction(custom)) throw new Error('Expected a Custom fee');
            await act(async () => {
                store.dispatch(
                    transactionManagementActions.storeCustomFeeLevel({ feeLevel: custom }),
                );
                await updateEarnSelectedFeeLevelThunk({
                    accountKey: account.key,
                    formDraftKey: result.current.formDraftKey,
                    feeLevelLabel: 'custom',
                    feePerUnit: '3',
                })(store.dispatch, store.getState, {});
            });
            expect(result.current.preparedAction?.unsignedTransaction).toMatchObject({
                gasLimit: '42000',
                maxFeePerGas: '3000000000',
                maxPriorityFeePerGas: '1000000000',
            });
            await act(() =>
                store.dispatch(
                    feesActions.updateMultipleFees({
                        eth: {
                            status: 'loaded',
                            data: {
                                ...feeInfo,
                                levels: [{ ...feeInfo.levels[0]!, maxFeePerGas: '4000000000' }],
                            },
                        },
                    }),
                ),
            );
            expect(result.current.selectedFee).toBe('custom');
            expect(result.current.feePreview?.fee).toBe('126000000000000');
            estimateFeeMock.mockResolvedValueOnce({
                success: true,
                payload: { feeLimit: gasLimit, feePerUnit: '1' },
            });
            await rerender({ accountRewards: createAccountRewards('200'), isEnabled: true });
            await settle();
            expect(result.current.selectedFee).toBe(selectedFee);
            expect(result.current.preparedAction?.unsignedTransaction).toMatchObject({
                gasLimit: selectedGasLimit,
                maxFeePerGas,
            });
        },
    );

    it('retains estimated gas when funds are insufficient and recovers after a top-up', async () => {
        const rewards = createAccountRewards();
        const withBalance = (availableBalance: string) => ({
            ...rewards,
            account: { ...account, availableBalance },
        });
        const { result, rerender } = await renderFees({
            accountRewards: withBalance('0'),
            isEnabled: true,
        });
        await settle();
        expect(result.current.formDraft?.estimatedFeeLimit).toBe('21000');
        expect(result.current.isFeeUnavailable).toBe(true);
        expect(result.current.hasFeeEstimationError).toBe(false);
        expect(result.current.preparedAction).toBeNull();
        await rerender({ accountRewards: withBalance('42000000000000'), isEnabled: true });
        await settle();
        expect(result.current.isFeeUnavailable).toBe(false);
        expect(result.current.preparedAction).not.toBeNull();
        await rerender({ accountRewards: withBalance('0'), isEnabled: true });
        await settle();
        expect(result.current.preparedAction).toBeNull();
        expect(mockGetCurrentNonce).toHaveBeenCalledTimes(3);
    });

    it('updates reward fiat values without estimating again for fiat-only changes or identical rates', async () => {
        const { result, rerender, store } = await renderFees();
        await settle();
        const current = result.current.preparedAction;
        const updatedRewards = createAccountRewards();
        updatedRewards.rewards = updatedRewards.rewards.map(reward => ({
            ...reward,
            fiat: { ...reward.fiat, claimable: asBaseCurrencyAmount(new BigNumber(2)) },
        }));
        await rerender({ accountRewards: updatedRewards, isEnabled: true });
        expect(result.current.preparedAction?.rewards).toBe(updatedRewards.rewards);
        await act(() =>
            store.dispatch(
                feesActions.updateMultipleFees({
                    eth: {
                        status: 'loaded',
                        data: { ...feeInfo, levels: feeInfo.levels.map(level => ({ ...level })) },
                    },
                }),
            ),
        );
        await settle();
        expect(result.current.preparedAction?.unsignedTransaction).toEqual(
            current?.unsignedTransaction,
        );
        expect(result.current.isComposingFeeLevels).toBe(false);
        expect(estimateFeeMock).toHaveBeenCalledTimes(1);
    });

    it('keeps a prepared action during a status-only background refresh', async () => {
        const { result, store } = await renderFees();
        await settle();
        const current = result.current.preparedAction;
        await act(() =>
            store.dispatch(
                feesActions.updateMultipleFees({ eth: { status: 'loading', data: feeInfo } }),
            ),
        );
        expect(result.current.preparedAction).toBe(current);
        expect(result.current.isComposingFeeLevels).toBe(false);
        await settle();
        expect(estimateFeeMock).toHaveBeenCalledTimes(1);
    });

    it('ignores a pending estimate after losing focus', async () => {
        const pending = createDeferred<Awaited<ReturnType<typeof estimateYieldFeeLevel>>>();
        estimateFeeMock.mockReturnValueOnce(pending.promise);
        const { result, rerender } = await renderFees();
        await settle();
        await rerender({ ...initialProps, isEnabled: false });
        await act(() => pending.resolve(estimatedFee));
        expect(result.current.preparedAction).toBeNull();
        expect(result.current.hasFeeEstimationError).toBe(false);
    });
});
