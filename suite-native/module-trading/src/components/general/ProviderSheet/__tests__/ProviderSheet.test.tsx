import { TradingTradeType, TradingType } from '@suite-common/trading';
import { FeatureFlag } from '@suite-native/feature-flags';
import { screen } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { buyQuotes, getWalletState } from '@suite-native/trading-fixtures';

import { ProviderSheet, ProviderSheetProps } from '../ProviderSheet';

describe('ProviderSheet', () => {
    const renderProviderSheet = (
        props: Partial<ProviderSheetProps<TradingType, TradingTradeType>> = {},
        preloadedState: PreloadedState = {},
    ) =>
        renderWithStoreProviderAsync(
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

    it('should render empty providers placeholder and no section header and for buy', async () => {
        const { queryByText, getByText } = await renderProviderSheet({}, {});

        expect(getByText('No offers available.')).toBeOnTheScreen();
        expect(queryByText('Fixed-rate CEX')).toBeNull();
    });

    it('should render section header and empty placeholder for exchange', async () => {
        const { getByText } = await renderProviderSheet({ tradingType: 'exchange' }, {});

        expect(getByText('No offers available.')).toBeOnTheScreen();
        expect(getByText('Fixed-rate CEX')).toBeOnTheScreen();
    });

    it('should render all section headers for exchange', async () => {
        const { getByText } = await renderProviderSheet(
            { tradingType: 'exchange', quotes: { fixed: [], float: [], dex: [] } },
            { featureFlags: { [FeatureFlag.AreTradingExchangeDexesEnabled]: true } },
        );

        expect(getByText('Fixed-rate CEX')).toBeOnTheScreen();
        expect(getByText('Floating-rate CEX')).toBeOnTheScreen();
        expect(getByText('DEX')).toBeOnTheScreen();
    });

    it('should not render DEX section header for exchange when DEXes are disabled', async () => {
        const { queryByText, getByText } = await renderProviderSheet(
            { tradingType: 'exchange', quotes: { fixed: [], float: [], dex: [] } },
            { featureFlags: { [FeatureFlag.AreTradingExchangeDexesEnabled]: false } },
        );

        expect(getByText('Fixed-rate CEX')).toBeOnTheScreen();
        expect(getByText('Floating-rate CEX')).toBeOnTheScreen();
        expect(queryByText('DEX')).toBeNull();
    });

    it('should render provided quotes', async () => {
        const { queryByText, getByText } = await renderProviderSheet(
            { quotes: { fixed: [buyQuotes[0]] } },
            { wallet: getWalletState() },
        );

        expect(queryByText('No offers available.')).toBeNull();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });
});
