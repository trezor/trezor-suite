import { type UnknownAction, combineReducers } from '@reduxjs/toolkit';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { feesReducer, formDraftActions, formDraftReducer } from '@suite-common/wallet-core';
import { mockResolvedYieldFlowData } from '@suite-common/wallet-core/mocks';
import { type FeeInfo, type FeesState } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { prepareSendFormReducer } from '@suite-native/transaction-management';
import { mock } from '@trezor/dependency-injection';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { useWrappedNativeTokenFees } from './useWrappedNativeTokenFees';
import { useYieldDepositFees } from '../yield/useYieldDepositFees';

const mockCompose = mock<
    () => Promise<{
        type: 'action-ready';
        receiptAmount: string;
        unsignedTransaction: string;
    }>
>();

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    updateFeeInfoThunk: () => () => ({ unwrap: () => Promise.resolve() }),
    composeYieldDepositTransactionThunk: () => () => ({ unwrap: () => mockCompose() }),
    composeYieldWrapTransactionThunk: () => () => ({ unwrap: () => mockCompose() }),
    composeYieldUnwrapTransactionThunk: () => () => ({ unwrap: () => mockCompose() }),
}));

type FlowData = ReturnType<typeof mockResolvedYieldFlowData>;
type HookParams = {
    flow: FlowData;
    amount: string;
};
type FeeState = Pick<
    ReturnType<typeof useWrappedNativeTokenFees>,
    'formDraft' | 'formDraftKey' | 'getCustomFeeLevel' | 'isFeeReady'
>;

const useDepositFees = ({ flow, amount }: HookParams): FeeState => {
    const fees = useYieldDepositFees({ ...flow, amount, isEnabled: true });

    return { ...fees, isFeeReady: fees.isDepositFeeReady };
};

const useWrapFees = ({ flow, amount }: HookParams): FeeState =>
    useWrappedNativeTokenFees({
        account: flow.account,
        amount,
        flowType: 'wrap',
        isEnabled: true,
        onComposeError: mock(),
    });

const useUnwrapFees = ({ flow, amount }: HookParams): FeeState =>
    useWrappedNativeTokenFees({
        account: flow.account,
        amount,
        flowType: 'unwrap',
        isEnabled: true,
        onComposeError: mock(),
    });

const flows = [
    {
        name: 'deposit',
        useFees: useDepositFees,
        amount: '1',
        value: '0x0',
        gasLimit: '0x927c0',
        customGasLimit: '600000',
        customFee: '60000000000000000',
        requiredBalance: 60000000000000000n,
    },
    {
        name: 'wrap',
        useFees: useWrapFees,
        amount: '0.005',
        value: '0x11c37937e08000',
        gasLimit: '0xc350',
        customGasLimit: '100000',
        customFee: '10000000000000000',
        requiredBalance: 15000000000000000n,
    },
    {
        name: 'unwrap',
        useFees: useUnwrapFees,
        amount: '0.005',
        value: '0x0',
        gasLimit: '0x88b8',
        customGasLimit: '100000',
        customFee: '10000000000000000',
        requiredBalance: 10000000000000000n,
    },
];

const settle = () => act(() => jest.advanceTimersByTimeAsync(300));

describe.each(flows)('$name prepared fee affordability', flowCase => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    it.each([
        { feeType: 'legacy', balanceDifference: -1n, isAffordable: false },
        { feeType: 'legacy', balanceDifference: 0n, isAffordable: true },
        { feeType: 'legacy', balanceDifference: 1n, isAffordable: true },
        { feeType: 'eip1559', balanceDifference: -1n, isAffordable: false },
        { feeType: 'eip1559', balanceDifference: 0n, isAffordable: true },
        { feeType: 'eip1559', balanceDifference: 1n, isAffordable: true },
    ])(
        'checks $feeType Custom value plus fee at balance difference $balanceDifference',
        async ({ feeType, balanceDifference, isAffordable }) => {
            const isEip1559 = feeType === 'eip1559';
            const availableBalance = (flowCase.requiredBalance + balanceDifference).toString();
            const flow = mockResolvedYieldFlowData({
                account: mockWalletAccount({
                    symbol: asNetworkSymbol('eth'),
                    availableBalance,
                }),
            });
            const feeInfo: FeeInfo = {
                blockHeight: 100,
                blockTime: 12,
                minFee: 1,
                maxFee: 100,
                minPriorityFee: 0,
                levels: [
                    {
                        label: 'normal',
                        blocks: 1,
                        feePerUnit: '1000000000',
                        ...(isEip1559
                            ? {
                                  maxFeePerGas: '1000000000',
                                  maxPriorityFeePerGas: '100000000',
                                  baseFeePerGas: '500000000',
                              }
                            : {}),
                    },
                ],
            };
            const unsignedTransaction = JSON.stringify({
                from: '0x1111111111111111111111111111111111111111',
                to: '0x0000000000000000000000000000000000000001',
                data: '0x6e553f65',
                chainId: 1,
                nonce: '0x1',
                value: flowCase.value,
                gasLimit: flowCase.gasLimit,
                ...(isEip1559
                    ? { type: 2, maxFeePerGas: '0x3b9aca00', maxPriorityFeePerGas: '0x5f5e100' }
                    : { gasPrice: '0x3b9aca00' }),
            });
            mockCompose.mockResolvedValue({
                type: 'action-ready',
                receiptAmount: '1',
                unsignedTransaction,
            });
            const store = createLightStore({
                reducer: {
                    discreetMode: createStaticReducer({ isActive: false }),
                    locale: createStaticReducer({
                        systemLocaleCode: 'en',
                        appLocaleCode: 'system',
                    }),
                    wallet: combineReducers({
                        settings: createStaticReducer({
                            localCurrency: 'usd',
                            bitcoinAmountUnit: 0,
                        }),
                        fees: (
                            state: FeesState = { eth: { status: 'loaded', data: feeInfo } },
                            action: UnknownAction,
                        ) => feesReducer(state, action),
                        formDrafts: formDraftReducer,
                        send: prepareSendFormReducer({
                            actionTypes: { storageLoad: mockActionType('storageLoad') },
                            reducers: { storageLoadFormDrafts: mockReducer() },
                        }),
                    }),
                },
            });
            const { result } = await renderHookWithStoreProvider(flowCase.useFees, {
                initialProps: { flow, amount: flowCase.amount },
                services: { store, analytics: mockNativeAnalytics() },
            });
            await settle();
            expect(result.current.isFeeReady).toBe(true);

            const customFee = {
                label: 'custom' as const,
                blocks: -1,
                feePerUnit: '100',
                feeLimit: flowCase.customGasLimit,
                ...(isEip1559 ? { maxFeePerGas: '100', maxPriorityFeePerGas: '1' } : {}),
            };
            const customPreview = result.current.getCustomFeeLevel(customFee);
            expect(customPreview).toMatchObject(
                isAffordable
                    ? { type: 'final', fee: flowCase.customFee }
                    : { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' },
            );

            await act(() =>
                store.dispatch(
                    formDraftActions.storeDraft({
                        key: result.current.formDraftKey,
                        formDraft: {
                            ...result.current.formDraft!,
                            selectedFee: 'custom',
                            feePerUnit: customFee.feePerUnit,
                            feeLimit: customFee.feeLimit,
                            maxFeePerGas: customFee.maxFeePerGas,
                            maxPriorityFeePerGas: customFee.maxPriorityFeePerGas,
                        },
                    }),
                ),
            );

            expect(store.getState().wallet.send.feeLevels.normal?.type).toBe('final');
            expect(store.getState().wallet.send.feeLevels.custom?.type).toBe(
                isAffordable ? 'final' : 'error',
            );
            expect(result.current.formDraft?.selectedFee).toBe('custom');
            expect(result.current.isFeeReady).toBe(isAffordable);
        },
    );
});
