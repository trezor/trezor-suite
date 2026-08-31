import '@suite-common/test-utils/globalOverrides';

import userEvent from '@testing-library/user-event';

import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { openModal } from '@suite/modal';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { getTxExplorerUrl } from '@suite-common/wallet-config';
import { explorerInitialState, transactionsInitialState } from '@suite-common/wallet-core';
import { type WalletAccountTransaction, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TradingDetailTxId } from './TradingDetailTxId';
import { mockInitialAppState } from '../../../../../../mocks/mockInitialAppState';

const sendAccount = mockWalletAccount({
    symbol: 'btc',
    descriptor: asAccountDescriptor('btcDescriptor'),
});
const receiveAccount = mockWalletAccount({
    symbol: 'eth',
    descriptor: asAccountDescriptor('ethDescriptor'),
});

const payoutTxid = 'payoutTxid';
const sendTxid = 'sendTxid';
const notLoadedTxid = 'notLoadedTxid';

const getInitialState = (): AppState => ({
    ...mockInitialAppState,
    wallet: {
        ...mockInitialAppState.wallet,
        accounts: [sendAccount, receiveAccount],
        explorer: explorerInitialState,
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
    const root = createTestCompositionRoot({
        extra: { services: { analytics: mockDesktopAnalytics() } },
        preloadedState: getInitialState(),
    });

    const { container } = renderWithProviders(
        root,
        <TradingDetailTxId
            value={value}
            account={sendAccount}
            receiveAccountKey={receiveAccount.key}
        />,
    );

    const link = container.querySelector('a');
    if (!link) throw new Error('The transaction ID is not rendered as a link.');

    return { root, link };
};

describe('TradingDetailTxId', () => {
    it('opens the transaction detail of the account holding the transaction', async () => {
        const { root, link } = renderTxId(payoutTxid);

        await userEvent.click(link);

        expect(root.services.getActions()).toContainEqual(
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
        const { root, link } = renderTxId(sendTxid);

        await userEvent.click(link);

        expect(root.services.getActions()).toContainEqual(
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
        const { root, link } = renderTxId(notLoadedTxid);

        expect(link).toHaveAttribute(
            'href',
            getTxExplorerUrl(explorerInitialState[sendAccount.symbol].default, notLoadedTxid),
        );

        await userEvent.click(link);

        expect(root.services.getActions()).toEqual([]);
    });
});
