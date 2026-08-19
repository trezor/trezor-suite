import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { banxaCreditCardSellQuote, eth1NormalAccount } from '@suite-native/trading-fixtures';

import { useSellPreviewFlow } from './useSellPreviewFlow';
import { createTradingLightStore } from '../../test-utils/tradingTestUtils';

const mockReplace = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ replace: mockReplace }),
}));

const mockReport = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(mockReport),
};

describe('useSellPreviewFlow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('reports preview continue and replaces the route', () => {
        const store = createTradingLightStore({
            tradeType: 'sell',
            overrides: {
                wallet: {
                    trading: {
                        sell: {
                            selectedQuote: banxaCreditCardSellQuote,
                            tradingAccountKey: eth1NormalAccount.key,
                        },
                    },
                },
            },
        });
        const { result } = renderHookWithStoreProvider(() => useSellPreviewFlow(), {
            store,
            services,
        });

        act(() => result.current.continueToProvider());

        expect(mockReplace).toHaveBeenCalledWith('TradingSellCompletion');
        expect(mockReport).toHaveBeenCalledWith({
            type: events.tradingSellEvent.name,
            payload: expect.objectContaining({
                step: 'transaction-preview',
                action: 'continue',
            }),
        });
    });
});
