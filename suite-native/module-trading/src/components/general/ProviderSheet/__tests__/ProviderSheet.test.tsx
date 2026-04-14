import { type TradingTradeType, type TradingType } from '@suite-common/trading';
import { FeatureFlag } from '@suite-native/feature-flags';
import { type PreloadedState, renderWithStoreProvider, screen } from '@suite-native/test-utils';
import { getWalletState, mercuryoApplePayBuyQuote } from '@suite-native/trading-fixtures';

import { ProviderSheet, type ProviderSheetProps } from '../ProviderSheet';

describe('ProviderSheet', () => {
    const renderProviderSheet = (
        props: Partial<ProviderSheetProps<TradingType, TradingTradeType>> = {},
        preloadedState: PreloadedState = {},
    ) =>
        renderWithStoreProvider(
            <ProviderSheet
                onClose={jest.fn()}
                isVisible={true}
                onQuoteSelect={jest.fn()}
                quotes={{ fixed: [] }}
                tradingType="buy"
                {...props}
            />,
            { preloadedState },
        );

    afterEach(() => {
        screen.unmount();
    });

    it('should render empty providers placeholder and no section header and for buy', () => {
        const { queryByText, getByText } = renderProviderSheet({}, {});

        expect(getByText('No offers available.')).toBeOnTheScreen();
        expect(queryByText('Fixed-rate CEX')).toBeNull();
    });

    it('should render section header and empty placeholder for exchange', () => {
        const { getByText } = renderProviderSheet({ tradingType: 'exchange' }, {});

        expect(getByText('No offers available.')).toBeOnTheScreen();
        expect(getByText('Fixed-rate CEX')).toBeOnTheScreen();
    });

    it('should render all section headers for exchange', () => {
        const { getByText } = renderProviderSheet(
            { tradingType: 'exchange', quotes: { fixed: [], float: [], dex: [] } },
            { featureFlags: { [FeatureFlag.AreTradingExchangeDexesEnabled]: true } },
        );

        expect(getByText('Fixed-rate CEX')).toBeOnTheScreen();
        expect(getByText('Floating-rate CEX')).toBeOnTheScreen();
        expect(getByText('DEX')).toBeOnTheScreen();
    });

    it('should not render DEX section header for exchange when DEXes are disabled', () => {
        const { queryByText, getByText } = renderProviderSheet(
            { tradingType: 'exchange', quotes: { fixed: [], float: [], dex: [] } },
            { featureFlags: { [FeatureFlag.AreTradingExchangeDexesEnabled]: false } },
        );

        expect(getByText('Fixed-rate CEX')).toBeOnTheScreen();
        expect(getByText('Floating-rate CEX')).toBeOnTheScreen();
        expect(queryByText('DEX')).toBeNull();
    });

    it('should render provided quotes', () => {
        const { queryByText, getByText } = renderProviderSheet(
            { quotes: { fixed: [mercuryoApplePayBuyQuote] } },
            { wallet: getWalletState() },
        );

        expect(queryByText('No offers available.')).toBeNull();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });
});
