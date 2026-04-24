import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { buyQuotes, sellQuotes } from '@suite-native/trading-fixtures';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    createTradingPreloadedState,
} from '../../../__tests__/tradingTestUtils';
import { BuySellKYCWarning } from '../BuySellKYCWarning';

const KYC_REQUIRED_TEXT = getTranslation('moduleTrading.tradingScreen.kycRequired');

type BuySellKYCWarningTestProps = {
    overrides?: PreloadedStatePartial<TradingTestPreloadedState>;
    type: 'buy' | 'sell';
};

const renderBuySellKYCWarning = ({ overrides = {}, type }: BuySellKYCWarningTestProps) =>
    renderWithStoreProvider(<BuySellKYCWarning type={type} />, {
        preloadedState: createTradingPreloadedState({ overrides, tradeType: type }),
    });

describe('BuySellKYCWarning', () => {
    it.each([
        {
            type: 'buy' as const,
            overrides: {
                wallet: {
                    trading: {
                        buy: {
                            isLoading: true,
                            quotes: buyQuotes,
                        },
                    },
                },
            },
        },
        {
            type: 'sell' as const,
            overrides: {
                wallet: {
                    trading: {
                        sell: {
                            isLoading: true,
                            quotes: sellQuotes,
                        },
                    },
                },
            },
        },
    ])('should not render KYC warning when $type quotes are loading', ({ overrides, type }) => {
        const { queryByText } = renderBuySellKYCWarning({ overrides, type });

        expect(queryByText(KYC_REQUIRED_TEXT)).toBeNull();
    });

    it.each([
        {
            type: 'buy' as const,
            overrides: {
                wallet: {
                    trading: {
                        buy: {
                            quotes: [],
                        },
                    },
                },
            },
        },
        {
            type: 'sell' as const,
            overrides: {
                wallet: {
                    trading: {
                        sell: {
                            quotes: [],
                        },
                    },
                },
            },
        },
    ])('should not render KYC warning when $type has no quotes', ({ overrides, type }) => {
        const { queryByText } = renderBuySellKYCWarning({ overrides, type });

        expect(queryByText(KYC_REQUIRED_TEXT)).toBeNull();
    });

    it.each([
        {
            type: 'buy' as const,
            overrides: {
                wallet: {
                    trading: {
                        buy: {
                            quotes: buyQuotes,
                        },
                    },
                },
            },
        },
        {
            type: 'sell' as const,
            overrides: {
                wallet: {
                    trading: {
                        sell: {
                            quotes: sellQuotes,
                        },
                    },
                },
            },
        },
    ])('should render KYC warning when $type preconditions are met', ({ overrides, type }) => {
        const { getByText } = renderBuySellKYCWarning({ overrides, type });

        expect(getByText(KYC_REQUIRED_TEXT)).toBeOnTheScreen();
    });
});
