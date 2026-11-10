import { type CryptoId } from 'invity-api';

import { type TradingTransactionExchange, initialState } from '@suite-common/trading';
import { asNetworkSymbol, getTxExplorerUrl } from '@suite-common/wallet-config';
import { explorerInitialState, transactionsInitialState } from '@suite-common/wallet-core';
import { type WalletAccountTransaction, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useOpenTradeTransaction } from './useOpenTradeTransaction';

const mockOpenLink = jest.fn();
jest.mock('@suite-native/link', () => ({ useOpenLink: () => mockOpenLink }));

const mockNavigateToTransactionDetail = jest.fn();
jest.mock('@suite-native/navigation', () => ({
    useNavigateToTransactionDetail: () => mockNavigateToTransactionDetail,
}));

const sendAccount = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    descriptor: asAccountDescriptor('btcDescriptor'),
});
const receiveAccount = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor('ethDescriptor'),
});
const sendTxid = 'sendTxid';
const loadedPayoutTxid = 'loadedPayoutTxid';
const notLoadedPayoutTxid = 'notLoadedPayoutTxid';

const crossChainSwap: TradingTransactionExchange = {
    tradeType: 'exchange',
    key: 'crossChainSwap',
    date: '2026-01-01T00:00:00.000Z',
    sendAccountKey: sendAccount.key,
    receiveAccountKey: receiveAccount.key,
    sendTxid,
    data: {
        send: 'bitcoin' as CryptoId,
        receive: 'ethereum' as CryptoId,
        receiveTxHash: notLoadedPayoutTxid,
    },
};

const renderOpenTradeTransaction = (txid: string | undefined) =>
    renderHookWithStoreProvider(useOpenTradeTransaction, {
        initialProps: {
            txid,
            sendAccountKey: sendAccount.key,
            receiveAccountKey: receiveAccount.key,
        },
        preloadedState: {
            wallet: {
                trading: { ...initialState, trades: [crossChainSwap] },
                accounts: [sendAccount, receiveAccount],
                explorer: explorerInitialState,
                transactions: {
                    ...transactionsInitialState,
                    transactions: {
                        [sendAccount.key]: [{ txid: sendTxid } as WalletAccountTransaction],
                        [receiveAccount.key]: [
                            { txid: loadedPayoutTxid } as WalletAccountTransaction,
                        ],
                    },
                },
            },
        },
    });

describe('useOpenTradeTransaction', () => {
    beforeEach(() => jest.clearAllMocks());

    it.each([
        ['the receive account', loadedPayoutTxid, receiveAccount.key],
        ['the send account', sendTxid, sendAccount.key],
    ])('opens the transaction detail on %s holding it', async (_, txid, accountKey) => {
        const { result } = await renderOpenTradeTransaction(txid);

        result.current?.();

        expect(mockNavigateToTransactionDetail).toHaveBeenCalledWith({ txid, accountKey });
        expect(mockOpenLink).not.toHaveBeenCalled();
    });

    it('opens a payout no account has loaded in the explorer of the receive network', async () => {
        const { result } = await renderOpenTradeTransaction(notLoadedPayoutTxid);

        result.current?.();

        expect(mockOpenLink).toHaveBeenCalledWith(
            getTxExplorerUrl(explorerInitialState.eth.default, notLoadedPayoutTxid),
        );
        expect(mockNavigateToTransactionDetail).not.toHaveBeenCalled();
    });

    it('has nothing to open without a transaction id', async () => {
        const { result } = await renderOpenTradeTransaction(undefined);

        expect(result.current).toBeUndefined();
    });
});
