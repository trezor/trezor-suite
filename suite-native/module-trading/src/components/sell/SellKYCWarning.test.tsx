import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { sellQuotes } from '@suite-native/trading-fixtures';

import { SellKYCWarning } from './SellKYCWarning';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    createTradingPreloadedState,
} from '../../__tests__/tradingTestUtils';

describe('SellKYCWarning', () => {
    const KYC_REQUIRED_TEXT = getTranslation('moduleTrading.tradingScreen.kycRequired');

    const renderSellKYCWarning = (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        renderWithStoreProvider(<SellKYCWarning />, {
            preloadedState: createTradingPreloadedState({ overrides, tradeType: 'sell' }),
        });

    it('does not render KYC warning when quotes are loading', () => {
        const { queryByText } = renderSellKYCWarning({
            wallet: {
                trading: {
                    sell: {
                        isLoading: true,
                        quotes: sellQuotes,
                    },
                },
            },
        });

        expect(queryByText(KYC_REQUIRED_TEXT)).toBeNull();
    });

    it('does not render KYC warning when there are no quotes', () => {
        const { queryByText } = renderSellKYCWarning({
            wallet: {
                trading: {
                    sell: {
                        quotes: [],
                    },
                },
            },
        });

        expect(queryByText(KYC_REQUIRED_TEXT)).toBeNull();
    });

    it('renders KYC warning when quotes are loaded', () => {
        const { getByText } = renderSellKYCWarning({
            wallet: {
                trading: {
                    sell: {
                        quotes: sellQuotes,
                    },
                },
            },
        });

        expect(getByText(KYC_REQUIRED_TEXT)).toBeOnTheScreen();
    });
});
