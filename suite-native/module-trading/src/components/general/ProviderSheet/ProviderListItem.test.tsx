import type { TradingTradeType } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import {
    banxaCreditCardSellQuote,
    cexdirectFloatingQuote,
    getInitializedTradingStateWithQuotes,
    invityDexQuote,
    mercuryoApplePayBuyQuote,
    mockWalletFiatRatesAndSettings,
} from '@suite-native/trading-fixtures';

import { ProviderListItem, type ProviderListItemProps } from './ProviderListItem';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../__tests__/tradingTestUtils';

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
                shouldShowExchangeType={false}
                tradingType="buy"
                {...props}
            />,
            { overrides: baseOverrides },
        );

    it('should render provider information correctly', () => {
        const { getByText } = renderProviderListItem(mercuryoApplePayBuyQuote);

        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });

    it('should render trading information with formatted strings', () => {
        const { getByText, queryByText } = renderProviderListItem(mercuryoApplePayBuyQuote);

        expect(
            queryByText(getTranslation('moduleTrading.providerListItem.centralizedExchange')),
        ).toBeNull();
        expect(getByText('€9,998.32 / 1 BTC')).toBeOnTheScreen();
    });

    it('should render centralized exchange information for CEX providers when enabled', () => {
        const { getByText } = renderProviderListItem(cexdirectFloatingQuote, {
            shouldShowExchangeType: true,
            tradingType: 'exchange',
        });

        expect(
            getByText(getTranslation('moduleTrading.providerListItem.centralizedExchange')),
        ).toBeOnTheScreen();
    });

    it('should render KYC information when provider has KYC policy', () => {
        const { getByText } = renderProviderListItem(cexdirectFloatingQuote, {
            tradingType: 'exchange',
        });

        expect(getByText(getTranslation('moduleTrading.kyc.kycRequired'))).toBeOnTheScreen();
    });

    it('should render anonymous information for DEX providers', () => {
        const { getByText } = renderProviderListItem(invityDexQuote, {
            shouldShowExchangeType: true,
            tradingType: 'exchange',
        });

        expect(
            getByText(getTranslation('moduleTrading.providerListItem.anonymous')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.providerListItem.decentralizedExchange')),
        ).toBeOnTheScreen();
    });

    it('should not render when quote has no orderId', () => {
        const { orderId, ...quoteWithoutOrderId } = mercuryoApplePayBuyQuote;
        const quote = quoteWithoutOrderId as TradingTradeType;

        const { queryByText } = renderProviderListItem(quote);

        expect(queryByText('TestProvider')).toBeNull();
    });

    it('should render KYC warning for buy quote', () => {
        const { getByText } = renderProviderListItem(mercuryoApplePayBuyQuote);

        expect(
            getByText(getTranslation('moduleTrading.providerListItem.kycRequired')),
        ).toBeOnTheScreen();
    });

    it('should render KYC warning for sell quote', () => {
        const { getByText } = renderProviderListItem(banxaCreditCardSellQuote, {
            tradingType: 'sell',
        });

        expect(
            getByText(getTranslation('moduleTrading.providerListItem.kycRequired')),
        ).toBeOnTheScreen();
    });
});
