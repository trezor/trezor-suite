import type { CryptoId, ExchangeTrade } from 'invity-api';

import { tradingExchangeActions } from '@suite-common/trading';
import {
    type TestStore,
    initStore,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

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
        ({ store } = initStore({ wallet: getWalletState({ tradeType: 'exchange' }) }));
        store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
    });

    it('should render nothing when quote is not available', () => {
        store.dispatch(tradingExchangeActions.saveSelectedQuote(undefined));

        const { toJSON } = renderInfo({ variant: 'approve' });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when quote has no send field', () => {
        const quoteWithoutSend = { ...testQuote, send: undefined } as ExchangeTrade;
        store.dispatch(tradingExchangeActions.saveSelectedQuote(quoteWithoutSend));

        const { toJSON } = renderInfo({ variant: 'approve' });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when send crypto id has unknown network', () => {
        const quoteWithUnknownSend = {
            ...testQuote,
            send: 'unknown-crypto-id' as CryptoId,
        } as ExchangeTrade;
        store.dispatch(tradingExchangeActions.saveSelectedQuote(quoteWithUnknownSend));

        const { toJSON } = renderInfo({ variant: 'approve' });

        expect(toJSON()).toBeNull();
    });

    it('should render date, provider, limit and fee rows', () => {
        renderInfo({ variant: 'approve' });

        expect(screen.getByText('Date')).toBeOnTheScreen();
        expect(screen.getByText('Mercuryo')).toBeOnTheScreen();
        expect(screen.getByText('Limit')).toBeOnTheScreen();
        expect(screen.getByText('Maximum fee')).toBeOnTheScreen();
    });

    it('should render fee as "0" when fee is not a number', () => {
        const quoteWithStringFee = {
            ...testQuote,
            fee: 'UNKNOWN',
        } as ExchangeTrade;
        store.dispatch(tradingExchangeActions.saveSelectedQuote(quoteWithStringFee));

        renderInfo({ variant: 'approve' });

        expect(screen.getByText('0 ETH')).toBeOnTheScreen();
    });

    it('should render fee value when fee is a number', () => {
        const quoteWithNumericFee = {
            ...testQuote,
            fee: 42e15,
        } as ExchangeTrade;
        store.dispatch(tradingExchangeActions.saveSelectedQuote(quoteWithNumericFee));

        renderInfo({ variant: 'approve' });

        expect(screen.getByText('0.042 ETH')).toBeOnTheScreen();
    });
});
