import { type Store } from '@reduxjs/toolkit';
import type { ExchangeTrade } from 'invity-api';

import { tradingExchangeActions } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { exchangeQuotes } from '@suite-native/trading-fixtures';
import { type TradingRootState } from '@suite-native/trading-state';

import {
    ExchangeConfirmationHeader,
    type ExchangeConfirmationHeaderProps,
} from './ExchangeConfirmationHeader';
import { createTradingTestStore } from '../../../test-utils/tradingTestUtils';

type State = TradingRootState;

const testQuote = exchangeQuotes[0];

describe('ExchangeConfirmationHeader', () => {
    let store: Store<State>;

    const renderHeader = async (props: ExchangeConfirmationHeaderProps) =>
        await renderWithStoreProvider(<ExchangeConfirmationHeader {...props} />, {
            services: { store },
        });

    beforeEach(() => {
        store = createTradingTestStore({ tradeType: 'exchange' });
        store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
    });

    it('should render approve title with coin symbol when flowType is approve', async () => {
        const { getByTestId } = await renderHeader({ flowType: 'approve' });

        expect(getByTestId('@screen/sub-header/title')).toHaveTextContent(
            getTranslation('moduleTrading.tradingConfirmationScreen.approveHeaderTitle', {
                symbol: 'USDC',
            }),
        );
    });

    it('should render revoke title with coin symbol when flowType is revoke', async () => {
        const { getByTestId } = await renderHeader({ flowType: 'revoke' });

        expect(getByTestId('@screen/sub-header/title')).toHaveTextContent(
            getTranslation('moduleTrading.tradingConfirmationScreen.revokeHeaderTitle', {
                symbol: 'USDC',
            }),
        );
    });

    it('should render empty label when quote is not available', async () => {
        store.dispatch(tradingExchangeActions.saveSelectedQuote(undefined));

        const { getByTestId } = await renderHeader({ flowType: 'approve' });

        expect(getByTestId('@screen/sub-header/title')).toHaveTextContent('');
    });

    it('should render empty label when symbol was not found', async () => {
        const quoteWithUnknownSend = {
            ...testQuote,
            send: 'unknown-crypto-id',
        } as ExchangeTrade;
        store.dispatch(tradingExchangeActions.saveSelectedQuote(quoteWithUnknownSend));

        const { getByTestId } = await renderHeader({ flowType: 'revoke' });

        expect(getByTestId('@screen/sub-header/title')).toHaveTextContent('');
    });
});
