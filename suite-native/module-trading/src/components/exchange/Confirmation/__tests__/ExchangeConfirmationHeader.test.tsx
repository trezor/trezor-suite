import type { ExchangeTrade } from 'invity-api';

import { tradingExchangeActions } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { type TestStore, initStore, renderWithStoreProvider } from '@suite-native/test-utils';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import {
    ExchangeConfirmationHeader,
    type ExchangeConfirmationHeaderProps,
} from '../ExchangeConfirmationHeader';

const testQuote = exchangeQuotes[0];

describe('ExchangeConfirmationHeader', () => {
    let store: TestStore;

    const renderHeader = (props: ExchangeConfirmationHeaderProps) =>
        renderWithStoreProvider(<ExchangeConfirmationHeader {...props} />, { store });

    beforeEach(() => {
        store = initStore({ wallet: getWalletState({ tradeType: 'exchange' }) }).store;
        store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
    });

    it('should render approve title with coin symbol when flowType is approve', () => {
        const { getByTestId } = renderHeader({ flowType: 'approve' });

        expect(getByTestId('@screen/sub-header/title')).toHaveTextContent(
            getTranslation('moduleTrading.tradingConfirmationScreen.approveHeaderTitle', {
                symbol: 'USDC',
            }),
        );
    });

    it('should render revoke title with coin symbol when flowType is revoke', () => {
        const { getByTestId } = renderHeader({ flowType: 'revoke' });

        expect(getByTestId('@screen/sub-header/title')).toHaveTextContent(
            getTranslation('moduleTrading.tradingConfirmationScreen.revokeHeaderTitle', {
                symbol: 'USDC',
            }),
        );
    });

    it('should render empty label when quote is not available', () => {
        store.dispatch(tradingExchangeActions.saveSelectedQuote(undefined));

        const { queryByTestId } = renderHeader({ flowType: 'approve' });

        expect(queryByTestId('@screen/sub-header/title')).not.toBeOnTheScreen();
    });

    it('should render empty label when symbol was not found', () => {
        const quoteWithUnknownSend = {
            ...testQuote,
            send: 'unknown-crypto-id',
        } as ExchangeTrade;
        store.dispatch(tradingExchangeActions.saveSelectedQuote(quoteWithUnknownSend));

        const { queryByTestId } = renderHeader({ flowType: 'revoke' });

        expect(queryByTestId('@screen/sub-header/title')).not.toBeOnTheScreen();
    });
});
