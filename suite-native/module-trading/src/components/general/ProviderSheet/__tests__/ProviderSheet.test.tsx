import {
    EMPTY_GROUPED_TRADING_EXCHANGE_QUOTES,
    type TradingTradeType,
    type TradingType,
} from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { screen } from '@suite-native/test-utils-store';
import { cexdirectFloatingQuote, mercuryoApplePayBuyQuote } from '@suite-native/trading-fixtures';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../../__tests__/tradingTestUtils';
import { ProviderSheet, type ProviderSheetProps } from '../ProviderSheet';

describe('ProviderSheet', () => {
    const renderProviderSheet = (
        props: Partial<ProviderSheetProps<TradingType, TradingTradeType>> = {},
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        renderWithTradingProvider(
            <ProviderSheet
                onClose={jest.fn()}
                isVisible={true}
                onQuoteSelect={jest.fn()}
                quotes={{ fixed: [] }}
                tradingType="buy"
                {...props}
            />,
            { overrides },
        );

    afterEach(() => {
        screen.unmount();
    });

    it('should render empty providers placeholder and no section header and for buy', () => {
        const { queryByText, getByText } = renderProviderSheet({}, {});

        expect(
            getByText(getTranslation('moduleTrading.providerSheet.noProviders')),
        ).toBeOnTheScreen();
        expect(queryByText(getTranslation('moduleTrading.providerSheet.fixed.title'))).toBeNull();
    });

    it('should render section header and empty placeholder for exchange', () => {
        const { getByText } = renderProviderSheet({ tradingType: 'exchange' }, {});

        expect(
            getByText(getTranslation('moduleTrading.providerSheet.noProviders')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.providerSheet.fixed.title')),
        ).toBeOnTheScreen();
    });

    it('should render all section headers for exchange', () => {
        const { getByText } = renderProviderSheet({
            tradingType: 'exchange',
            quotes: EMPTY_GROUPED_TRADING_EXCHANGE_QUOTES,
        });

        expect(
            getByText(getTranslation('moduleTrading.providerSheet.fixed.title')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.providerSheet.float.title')),
        ).toBeOnTheScreen();
        expect(getByText('DEX')).toBeOnTheScreen();
    });

    it('should render provided quotes', () => {
        const { queryByText, getByText } = renderProviderSheet({
            quotes: { fixed: [mercuryoApplePayBuyQuote] },
        });

        expect(queryByText(getTranslation('moduleTrading.providerSheet.noProviders'))).toBeNull();
        expect(
            queryByText(getTranslation('moduleTrading.providerListItem.centralizedExchange')),
        ).toBeNull();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });

    it('should render exchange type information for exchange quotes', () => {
        const { getByText } = renderProviderSheet({
            quotes: { fixed: [cexdirectFloatingQuote] },
            tradingType: 'exchange',
        });

        expect(
            getByText(getTranslation('moduleTrading.providerListItem.centralizedExchange')),
        ).toBeOnTheScreen();
    });
});
