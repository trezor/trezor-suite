import '@suite-common/test-utils/globalOverrides';

import userEvent from '@testing-library/user-event';

import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { openModal } from '@suite/modal';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { transactionsInitialState } from '@suite-common/wallet-core';
import { type WalletAccountTransaction, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TradingDetailTxId } from './TradingDetailTxId';
import { mockInitialAppState } from '../../../../../../mocks/mockInitialAppState';

const sendAccount = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    descriptor: asAccountDescriptor('btcDescriptor'),
});
const receiveAccount = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor('ethDescriptor'),
});

const payoutTxid = 'payoutTxid';

const getInitialState = (): AppState => ({
    ...mockInitialAppState,
    wallet: {
        ...mockInitialAppState.wallet,
        accounts: [sendAccount, receiveAccount],
        transactions: {
            ...transactionsInitialState,
            transactions: {
                [receiveAccount.key]: [
                    { txid: payoutTxid, symbol: receiveAccount.symbol } as WalletAccountTransaction,
                ],
                [sendAccount.key]: [],
            },
        },
    },
});

describe('TradingDetailTxId', () => {
    it('opens the transaction detail of the account holding the transaction', async () => {
        const services = { analytics: mockDesktopAnalytics() };
        const root = createTestCompositionRoot({
            extra: { services },
            preloadedState: getInitialState(),
        });

        const { container } = renderWithProviders(
            root,
            <TradingDetailTxId
                value={payoutTxid}
                account={sendAccount}
                receiveAccountKey={receiveAccount.key}
            />,
        );

        const link = container.querySelector('a');
        if (!link) throw new Error('The transaction ID is not rendered as a link.');

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
        const services = { analytics: mockDesktopAnalytics() };
        const root = createTestCompositionRoot({
            extra: { services },
            preloadedState: getInitialState(),
        });

        const { container } = renderWithProviders(
            root,
            <TradingDetailTxId
                value="signedSendTxid"
                account={sendAccount}
                receiveAccountKey={receiveAccount.key}
            />,
        );

        const link = container.querySelector('a');
        if (!link) throw new Error('The transaction ID is not rendered as a link.');

        await userEvent.click(link);

        expect(root.services.getActions()).toContainEqual(
            openModal({
                type: 'transaction-detail',
                txid: 'signedSendTxid',
                descriptor: sendAccount.descriptor,
                symbol: sendAccount.symbol,
                deviceState: sendAccount.deviceState,
                flow: 'detail',
            }),
        );
    });
});
