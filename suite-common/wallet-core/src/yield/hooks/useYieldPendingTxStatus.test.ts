/**
 * @jest-environment jsdom
 */
import { createAction } from '@reduxjs/toolkit';

import {
    act,
    createTestCompositionRoot,
    renderHookWithStoreProvider,
} from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useYieldEvmPendingTxStatus } from './useYieldPendingTxStatus';
import { type FeesRootState } from '../../fees/feesReducer';
import { transactionsInitialState } from '../../transactions/transactionsReducer';
import { type TransactionsRootState } from '../../transactions/transactionsReducerTypes';

type RootState = FeesRootState & TransactionsRootState;

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const to = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const nonce = 7;

const replaceAccountHistory = createAction<WalletAccountTransaction[]>(
    'test/replaceAccountHistory',
);

const createWrap = (txid: string, value: string, blockHeight = 0): WalletAccountTransaction => ({
    txid,
    blockHeight,
    type: 'sent',
    symbol: account.symbol,
    descriptor: account.descriptor,
    deviceState: account.deviceState,
    amount: value,
    fee: '0',
    targets: [],
    tokens: [],
    internalTransfers: [],
    details: {
        vin: [{ n: 0, isAddress: true, addresses: [account.descriptor] }],
        vout: [{ n: 0, isAddress: true, addresses: [to], value }],
        size: 0,
        totalInput: value,
        totalOutput: value,
    },
    ethereumSpecific: { nonce, data: '0xd0e30db0', gasLimit: 45_000, status: blockHeight ? 1 : -1 },
});

describe('useYieldEvmPendingTxStatus', () => {
    it('follows a replacement from the first account observation using the signed nonce', () => {
        const initialState: RootState = {
            wallet: {
                accounts: [account],
                fees: {},
                transactions: {
                    ...transactionsInitialState,
                    transactions: { [account.key]: [createWrap('first-speed-up', '42')] },
                },
            },
        };
        const { services } = createTestCompositionRoot<void, RootState>({
            reducer: (state = initialState, action) =>
                replaceAccountHistory.match(action)
                    ? {
                          wallet: {
                              ...state.wallet,
                              transactions: {
                                  ...state.wallet.transactions,
                                  transactions: { [account.key]: action.payload },
                              },
                          },
                      }
                    : state,
        });

        const { result } = renderHookWithStoreProvider(
            () =>
                useYieldEvmPendingTxStatus(account, {
                    type: 'wrap',
                    txid: 'original',
                    nonce,
                    amount: '0.000000000000000042',
                }),
            { services },
        );

        expect(result.current).toMatchObject({ status: 'pending', txid: 'first-speed-up' });

        act(() => {
            services.store.dispatch(replaceAccountHistory([createWrap('second-speed-up', '42')]));
        });

        expect(result.current).toMatchObject({ status: 'pending', txid: 'second-speed-up' });

        act(() => {
            services.store.dispatch(replaceAccountHistory([createWrap('changed-amount', '43', 1)]));
        });

        expect(result.current.status).toBe('failed');
    });
});
