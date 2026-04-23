import type { TradingTradeType } from '@suite-common/trading';
import {
    banxaCreditCardSellQuote,
    cexdirectFloatingQuote,
    getInitializedTradingStateWithQuotes,
    invityDexQuote,
    mercuryoApplePayBuyQuote,
    mockWalletFiatRatesAndSettings,
} from '@suite-native/trading-fixtures';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../../__tests__/tradingTestUtils';
import { ProviderListItem, type ProviderListItemProps } from '../ProviderListItem';

const baseOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
    wallet: {
        ...mockWalletFiatRatesAndSettings(),
        trading: getInitializedTradingStateWithQuotes(),
    },
};

describe('ProviderListItem', () => {
    const renderProviderListItem = (
        quote: TradingTradeType,
        props?: Partial<ProviderListItemProps<TradingTradeType>>,
    ) =>
        renderWithTradingProvider(
            <ProviderListItem
                isSelected={false}
                onPress={jest.fn()}
                quote={quote}
                tradingType="buy"
                {...props}
            />,
            { overrides: baseOverrides, providers: ['intl', 'formatter'] },
        );

    it('should render provider information correctly', () => {
        const { getByText } = renderProviderListItem(mercuryoApplePayBuyQuote);

        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });

    it('should render trading information with formatted strings', () => {
        const { getByText } = renderProviderListItem(mercuryoApplePayBuyQuote);

        expect(getByText('Centralized exchange')).toBeOnTheScreen();
        expect(getByText('€9,998.32 / 1 BTC')).toBeOnTheScreen();
    });

    it('should render KYC information when provider has KYC policy', () => {
        const { getByText } = renderProviderListItem(cexdirectFloatingQuote, {
            tradingType: 'exchange',
        });

        expect(getByText('This provider requires to verify identity.')).toBeOnTheScreen();
    });

    it('should render anonymous information for DEX providers', () => {
        const { getByText } = renderProviderListItem(invityDexQuote, {
            tradingType: 'exchange',
        });

        expect(getByText('Anonymous')).toBeOnTheScreen();
        expect(getByText('Decentralized exchange')).toBeOnTheScreen();
    });

    it('should not render when quote has no orderId', () => {
        const { orderId, ...quoteWithoutOrderId } = mercuryoApplePayBuyQuote;
        const quote = quoteWithoutOrderId as TradingTradeType;

        const { queryByText } = renderProviderListItem(quote);

        expect(queryByText('TestProvider')).toBeNull();
    });

    it('should render KYC warning for buy quote', () => {
        const { getByText } = renderProviderListItem(mercuryoApplePayBuyQuote);

        expect(getByText('This provider requires to verify identity.')).toBeOnTheScreen();
    });

    it('should render KYC warning for sell quote', () => {
        const { getByText } = renderProviderListItem(banxaCreditCardSellQuote, {
            tradingType: 'sell',
        });

        expect(getByText('This provider requires to verify identity.')).toBeOnTheScreen();
    });
});
