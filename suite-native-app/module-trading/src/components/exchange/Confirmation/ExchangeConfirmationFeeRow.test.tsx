import { type Store } from '@reduxjs/toolkit';

import { mockNetworksServices } from '@suite-common/networks/mocks';
import { tradingExchangeActions } from '@suite-common/trading';
import { renderWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { mockTransaction } from '@suite-native/tokens';
import { exchangeQuotes } from '@suite-native/trading-fixtures';
import { type TradingRootState } from '@suite-native/trading-state';

import { ExchangeConfirmationFeeRow } from './ExchangeConfirmationFeeRow';
import { createTradingTestStore } from '../../../test-utils/tradingTestUtils';

const mockFeeSummaryRowProps = jest.fn();
jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    FeeSummaryRow: jest.fn(props => {
        mockFeeSummaryRowProps(props);

        return null;
    }),
}));

const testQuote = exchangeQuotes[0];

describe('ExchangeConfirmationFeeRow', () => {
    let store: Store<TradingRootState>;

    const renderFeeRow = (transaction = mockTransaction) =>
        renderWithStoreProvider(<ExchangeConfirmationFeeRow transaction={transaction} />, {
            services: { store, networks: mockNetworksServices() },
        });

    beforeEach(() => {
        jest.clearAllMocks();
        store = createTradingTestStore({ tradeType: 'exchange' });
        store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
    });

    it('renders the simplified fee row with the transaction fee', async () => {
        await renderFeeRow({ ...mockTransaction, fee: '42' });

        expect(mockFeeSummaryRowProps).toHaveBeenCalledWith(
            expect.objectContaining({ fee: '42', baseValueOnly: true, areFeesLoading: false }),
        );
    });

    it('falls back to the quote fee without a transaction', async () => {
        store.dispatch(tradingExchangeActions.saveSelectedQuote({ ...testQuote, fee: 7 }));

        await renderWithStoreProvider(<ExchangeConfirmationFeeRow transaction={null} />, {
            services: { store, networks: mockNetworksServices() },
        });

        expect(mockFeeSummaryRowProps).toHaveBeenCalledWith(expect.objectContaining({ fee: '7' }));
    });

    it('renders nothing without a quote', async () => {
        store.dispatch(tradingExchangeActions.saveSelectedQuote(undefined));

        await renderFeeRow();

        expect(mockFeeSummaryRowProps).not.toHaveBeenCalled();
        expect(screen.toJSON()).toBeNull();
    });
});
