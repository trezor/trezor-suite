import type { CryptoId, ExchangeTrade } from 'invity-api';

import { tradingExchangeActions } from '@suite-common/trading';
import { type TestStore, renderWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { mockTransaction } from '@suite-native/tokens';
import { exchangeQuotes } from '@suite-native/trading-fixtures';

import { createTradingLightStore } from '../../../../__tests__/tradingTestUtils';
import {
    ExchangeConfirmationInfo,
    type ExchangeConfirmationInfoCardProps,
} from '../ExchangeConfirmationInfo';

const testQuote = exchangeQuotes[0];

describe('ExchangeConfirmationInfo', () => {
    let store: TestStore;

    const renderInfo = (props: ExchangeConfirmationInfoCardProps) =>
        renderWithStoreProvider(<ExchangeConfirmationInfo {...props} />, { store });

    beforeEach(() => {
        store = createTradingLightStore({ tradeType: 'exchange' });
        store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
    });

    it('should render nothing when quote is not available', () => {
        store.dispatch(tradingExchangeActions.saveSelectedQuote(undefined));

        const { toJSON } = renderInfo({ flowType: 'approve', transaction: null });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when quote has no send field', () => {
        const quoteWithoutSend = { ...testQuote, send: undefined } as ExchangeTrade;
        store.dispatch(tradingExchangeActions.saveSelectedQuote(quoteWithoutSend));

        const { toJSON } = renderInfo({ flowType: 'approve', transaction: null });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when send crypto id has unknown network', () => {
        const quoteWithUnknownSend = {
            ...testQuote,
            send: 'unknown-crypto-id' as CryptoId,
        } as ExchangeTrade;
        store.dispatch(tradingExchangeActions.saveSelectedQuote(quoteWithUnknownSend));

        const { toJSON } = renderInfo({ flowType: 'approve', transaction: null });

        expect(toJSON()).toBeNull();
    });

    it('should not render date row when transaction is not available', () => {
        renderInfo({ flowType: 'approve', transaction: null });

        expect(screen.queryByText('Date')).toBeNull();
    });

    it('should render date row when transaction has blockTime', () => {
        renderInfo({ flowType: 'approve', transaction: mockTransaction });

        expect(screen.getByText('Date')).toBeOnTheScreen();
    });

    it('should render provider, limit and fee rows', () => {
        renderInfo({ flowType: 'approve', transaction: null });

        expect(screen.getByText('Mercuryo')).toBeOnTheScreen();
        expect(screen.getByText('Limit')).toBeOnTheScreen();
        expect(screen.getByText('Fee')).toBeOnTheScreen();
    });

    it('should render fee as "0" when transaction is not available and quote has no numeric fee', () => {
        renderInfo({ flowType: 'approve', transaction: null });

        expect(screen.getByText('0 ETH')).toBeOnTheScreen();
    });

    it('should render fee from quote when transaction is not available and quote has numeric fee', () => {
        const quoteWithNumericFee = { ...testQuote, fee: 42000000000000000 } as ExchangeTrade;
        store.dispatch(tradingExchangeActions.saveSelectedQuote(quoteWithNumericFee));

        renderInfo({ flowType: 'approve', transaction: null });

        expect(screen.getByText('0.042 ETH')).toBeOnTheScreen();
    });

    it('should render fee from transaction', () => {
        const transactionWithFee = { ...mockTransaction, fee: '42000000000000000' };

        renderInfo({ flowType: 'approve', transaction: transactionWithFee });

        expect(screen.getByText('0.042 ETH')).toBeOnTheScreen();
    });
});
