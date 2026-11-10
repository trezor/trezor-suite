import '@suite-common/test-utils/globalOverrides';

import userEvent from '@testing-library/user-event';
import { type CryptoId } from 'invity-api';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { openModal } from '@suite/modal';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type TradingTransactionExchange } from '@suite-common/trading';
import { asNetworkSymbol, getTxExplorerUrl } from '@suite-common/wallet-config';
import { explorerInitialState, transactionsInitialState } from '@suite-common/wallet-core';
import { type WalletAccountTransaction, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type WithServices } from '@trezor/redux-utils';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { TradingDetailTxId } from './TradingDetailTxId';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../mocks/mockInitialAppState';

const sendAccount = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    descriptor: asAccountDescriptor('btcDescriptor'),
});
const receiveAccount = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor('ethDescriptor'),
});

const payoutTxid = 'payoutTxid';
const sendTxid = 'sendTxid';
const notLoadedTxid = 'notLoadedTxid';
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

const getInitialState = (): MockSuiteState => ({
    ...mockInitialAppState,
    wallet: {
        ...mockInitialAppState.wallet,
        accounts: [sendAccount, receiveAccount],
        explorer: explorerInitialState,
        trading: { ...mockInitialAppState.wallet.trading, trades: [crossChainSwap] },
        transactions: {
            ...transactionsInitialState,
            transactions: {
                [receiveAccount.key]: [
                    { txid: payoutTxid, symbol: receiveAccount.symbol } as WalletAccountTransaction,
                ],
                [sendAccount.key]: [
                    { txid: sendTxid, symbol: sendAccount.symbol } as WalletAccountTransaction,
                ],
            },
        },
    },
});

const renderTxId = (value: string) => {
    const { services } = createTestCompositionRoot<
        WithServices<DesktopAnalyticsDep>,
        MockSuiteState
    >({
        preloadedState: getInitialState(),
        services: () => ({ analytics: mockDesktopAnalytics() }),
    });

    const { container } = renderWithProviders(
        services,
        <TradingDetailTxId
            value={value}
            account={sendAccount}
            receiveAccountKey={receiveAccount.key}
        />,
    );

    const link = container.querySelector('a');
    if (!link) throw new Error('The transaction ID is not rendered as a link.');

    return { getActions: services.store.getActions, link };
};

describe('TradingDetailTxId', () => {
    it('opens the transaction detail of the account holding the transaction', async () => {
        const { getActions, link } = renderTxId(payoutTxid);

        await userEvent.click(link);

        expect(getActions()).toContainEqual(
            openModal({
                type: 'transaction-detail',
                txid: payoutTxid,
                descriptor: receiveAccount.descriptor,
                symbol: receiveAccount.symbol,
                deviceState: receiveAccount.deviceState,
                flow: 'detail',
            }),
        );
    });

    it('falls back to the send account when the transaction is not on the receive account', async () => {
        const { getActions, link } = renderTxId(sendTxid);

        await userEvent.click(link);

        expect(getActions()).toContainEqual(
            openModal({
                type: 'transaction-detail',
                txid: sendTxid,
                descriptor: sendAccount.descriptor,
                symbol: sendAccount.symbol,
                deviceState: sendAccount.deviceState,
                flow: 'detail',
            }),
        );
    });

    // Suite records the transaction it broadcast itself, so an unknown hash belongs to the account
    // it was sent from.
    it('links a transaction no account has loaded to the explorer of the send network', async () => {
        const { getActions, link } = renderTxId(notLoadedTxid);

        expect(link).toHaveAttribute(
            'href',
            getTxExplorerUrl(explorerInitialState[sendAccount.symbol].default, notLoadedTxid),
        );

        await userEvent.click(link);

        expect(getActions()).toEqual([]);
    });

    it('links a swap payout no account has loaded to the explorer of the receive network', () => {
        const { link } = renderTxId(notLoadedPayoutTxid);

        expect(link).toHaveAttribute(
            'href',
            getTxExplorerUrl(
                explorerInitialState[receiveAccount.symbol].default,
                notLoadedPayoutTxid,
            ),
        );
    });
});
