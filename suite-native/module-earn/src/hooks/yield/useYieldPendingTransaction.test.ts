import { combineReducers, createAction, createReducer } from '@reduxjs/toolkit';

import { deviceInitialState } from '@suite-common/device';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type WrappedNativeFlowType,
    explorerInitialState,
    transactionsInitialState,
} from '@suite-common/wallet-core';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { deviceAuthorizationInitialState } from '@suite-native/device-authorization';
import { type WrappedNativeTokenPendingTxParams } from '@suite-native/navigation';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { mockTransaction } from '@suite-native/tokens';

import { useYieldPendingTransaction } from './useYieldPendingTransaction';
import { useYieldPendingTransactionTracking } from './useYieldPendingTransactionTracking';
import { useStandaloneWrappedNativeFlow } from '../earn/useStandaloneWrappedNativeFlow';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useIsFocused: () => true,
    useNavigation: () => ({}),
}));
jest.mock('@suite-native/link', () => ({ useOpenLink: () => jest.fn() }));

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const pendingParam: WrappedNativeTokenPendingTxParams = {
    amount: '1',
    fee: '1000',
    nonce: 7,
    submittedAt: 1700000000000,
    txid: 'original',
};

const useStandalonePendingModal = (type: WrappedNativeFlowType) =>
    useStandaloneWrappedNativeFlow({
        account,
        accountKey: account.key,
        amountValue: pendingParam.amount,
        flowType: type,
        isDisabled: false,
        pendingParam,
        preparedAction: null,
    }).pendingModalProps;

const useYieldPendingModal = (type: WrappedNativeFlowType) => {
    const pendingTransaction = { ...pendingParam, type };
    const trackedTxid = useYieldPendingTransactionTracking({
        account,
        flowKey: null,
        flowType: type === 'wrap' ? 'deposit' : 'withdraw',
        pendingTransaction,
    });

    return useYieldPendingTransaction({
        accountKey: account.key,
        isFocused: true,
        pendingTransaction,
        trackedTxid,
        transactionType: type,
    }).pendingModalProps;
};

type MockWrappedNativeTransactionParams = {
    type: WrappedNativeFlowType;
    txid: string;
    fee: string;
};

const mockWrappedNativeTransaction = ({
    type,
    txid,
    fee,
}: MockWrappedNativeTransactionParams): WalletAccountTransaction => ({
    ...mockTransaction,
    txid,
    fee,
    descriptor: account.descriptor,
    deviceState: account.deviceState,
    symbol: account.symbol,
    type: 'sent',
    blockHeight: 0,
    details: {
        ...mockTransaction.details,
        vin: [{ n: 0, isAddress: true, addresses: [account.descriptor] }],
        vout: [
            {
                n: 0,
                isAddress: true,
                addresses: ['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'],
                value: type === 'wrap' ? '1000000000000000000' : '0',
            },
        ],
    },
    ethereumSpecific: {
        nonce: 7,
        status: -1,
        gasLimit: 45_000,
        data: type === 'wrap' ? '0xd0e30db0' : `0x2e1a7d4d${'de0b6b3a7640000'.padStart(64, '0')}`,
    },
});

const replaceHistory = createAction<WalletAccountTransaction>('test/replaceHistory');

describe.each([
    { context: 'standalone', usePendingModal: useStandalonePendingModal },
    { context: 'Yield', usePendingModal: useYieldPendingModal },
])('$context pending transaction fee', ({ usePendingModal }) => {
    it.each(['wrap', 'unwrap'] as const)('follows each %s replacement', async type => {
        const original = mockWrappedNativeTransaction({ type, txid: 'original', fee: '900' });
        const createHistory = (transaction: WalletAccountTransaction) => ({
            ...transactionsInitialState,
            transactions: { [account.key]: [transaction] },
        });
        const store = createLightStore({
            reducer: {
                device: createStaticReducer(deviceInitialState),
                deviceAuthorization: createStaticReducer(deviceAuthorizationInitialState),
                locale: createStaticReducer({
                    appLocaleCode: 'en-US',
                    systemLocaleCode: 'en-US',
                    isSystemLocaleUsed: true,
                }),
                wallet: combineReducers({
                    explorer: createStaticReducer(explorerInitialState),
                    fees: createStaticReducer({}),
                    settings: createStaticReducer({ localCurrency: 'usd', bitcoinAmountUnit: 0 }),
                    transactions: createReducer(createHistory(original), builder => {
                        builder.addCase(replaceHistory, (_, { payload }) => createHistory(payload));
                    }),
                }),
            },
        });

        const { result } = await renderHookWithStoreProvider(() => usePendingModal(type), {
            services: { analytics: mockNativeAnalytics(), store },
        });

        expect(result.current).toMatchObject({ txid: 'original', fee: '1000' });

        for (const replacement of [
            { txid: 'first-speed-up', fee: '2000' },
            { txid: 'second-speed-up', fee: '3000' },
        ]) {
            await act(() => {
                store.dispatch(
                    replaceHistory(mockWrappedNativeTransaction({ type, ...replacement })),
                );
            });

            expect(result.current).toMatchObject(replacement);
        }
    });
});
