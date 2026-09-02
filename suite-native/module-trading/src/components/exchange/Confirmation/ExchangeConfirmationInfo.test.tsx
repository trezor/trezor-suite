import type { CryptoId, ExchangeTrade } from 'invity-api';

import { tradingExchangeActions } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { type TestStore, renderWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { mockTransaction } from '@suite-native/tokens';
import { exchangeQuotes } from '@suite-native/trading-fixtures';

import {
    ExchangeConfirmationInfo,
    type ExchangeConfirmationInfoCardProps,
} from './ExchangeConfirmationInfo';
import { createTradingLightStore } from '../../../test-utils/tradingTestUtils';

const testQuote = exchangeQuotes[0];

describe('ExchangeConfirmationInfo', () => {
    let store: TestStore;

    const renderInfo = async (props: ExchangeConfirmationInfoCardProps) =>
        await renderWithStoreProvider(<ExchangeConfirmationInfo {...props} />, { store });

    beforeEach(() => {
        store = createTradingLightStore({ tradeType: 'exchange' });
        store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
    });

    it('should render nothing when quote is not available', async () => {
        store.dispatch(tradingExchangeActions.saveSelectedQuote(undefined));

        const { toJSON } = await renderInfo({ flowType: 'approve', transaction: null });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when quote has no send field', async () => {
        const quoteWithoutSend = { ...testQuote, send: undefined } as ExchangeTrade;
        store.dispatch(tradingExchangeActions.saveSelectedQuote(quoteWithoutSend));

        const { toJSON } = await renderInfo({ flowType: 'approve', transaction: null });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when send crypto id has unknown network', async () => {
        const quoteWithUnknownSend = {
            ...testQuote,
            send: 'unknown-crypto-id' as CryptoId,
        } as ExchangeTrade;
        store.dispatch(tradingExchangeActions.saveSelectedQuote(quoteWithUnknownSend));

        const { toJSON } = await renderInfo({ flowType: 'approve', transaction: null });

        expect(toJSON()).toBeNull();
    });

    it('should not render date row when transaction is not available', async () => {
        await renderInfo({ flowType: 'approve', transaction: null });

        expect(
            screen.queryByText(getTranslation('moduleTrading.tradingConfirmationScreen.date')),
        ).toBeNull();
    });

    it('should render date row when transaction has blockTime', async () => {
        await renderInfo({ flowType: 'approve', transaction: mockTransaction });

        expect(
            screen.getByText(getTranslation('moduleTrading.tradingConfirmationScreen.date')),
        ).toBeOnTheScreen();
    });

    it('should render provider, limit and fee rows', async () => {
        await renderInfo({ flowType: 'approve', transaction: null });

        expect(screen.getByText('Mercuryo')).toBeOnTheScreen();
        expect(
            screen.getByText(
                getTranslation('moduleTrading.tradingExchangeApprovalScreen.limitLabel'),
            ),
        ).toBeOnTheScreen();
        expect(screen.getByText(getTranslation('transactions.detail.feeLabel'))).toBeOnTheScreen();
    });

    it('should render fee as "0" when transaction is not available and quote has no numeric fee', async () => {
        await renderInfo({ flowType: 'approve', transaction: null });

        expect(screen.getByText('0 ETH')).toBeOnTheScreen();
    });

    it('should render fee from quote when transaction is not available and quote has numeric fee', async () => {
        const quoteWithNumericFee = { ...testQuote, fee: 42000000000000000 } as ExchangeTrade;
        store.dispatch(tradingExchangeActions.saveSelectedQuote(quoteWithNumericFee));

        await renderInfo({ flowType: 'approve', transaction: null });

        expect(screen.getByText('0.042 ETH')).toBeOnTheScreen();
    });

    it('should render fee from transaction', async () => {
        const transactionWithFee = { ...mockTransaction, fee: '42000000000000000' };

        await renderInfo({ flowType: 'approve', transaction: transactionWithFee });

        expect(screen.getByText('0.042 ETH')).toBeOnTheScreen();
    });
});
