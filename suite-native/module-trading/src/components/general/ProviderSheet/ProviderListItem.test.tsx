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
} from '../../../test-utils/tradingTestUtils';

const baseOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
    wallet: {
        ...mockWalletFiatRatesAndSettings(),
        trading: getInitializedTradingStateWithQuotes(),
    },
};

describe('ProviderListItem', () => {
    const renderProviderListItem = async (
        quote: TradingTradeType,
        props?: Partial<ProviderListItemProps<TradingTradeType>>,
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = baseOverrides,
    ) =>
        await renderWithTradingProvider(
            <ProviderListItem
                isSelected={false}
                onPress={jest.fn()}
                quote={quote}
                shouldShowExchangeType={false}
                tradingType="buy"
                {...props}
            />,
            { overrides },
        );

    it('should render provider information correctly', async () => {
        const { getByText } = await renderProviderListItem(mercuryoApplePayBuyQuote);

        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });

    it('should render the amount in the header and not the rate row for a buy quote', async () => {
        const { getByText, queryByText } = await renderProviderListItem(mercuryoApplePayBuyQuote);

        expect(
            queryByText(getTranslation('moduleTrading.providerListItem.centralizedExchange')),
        ).toBeNull();
        expect(getByText('0.00100017 BTC')).toBeOnTheScreen();
        expect(queryByText('€9,998.32 / 1 BTC')).toBeNull();
    });

    it('should render the received amount in the header for an exchange quote', async () => {
        const { getByText } = await renderProviderListItem(cexdirectFloatingQuote, {
            tradingType: 'exchange',
        });

        expect(getByText('0.00089118 BTC')).toBeOnTheScreen();
    });

    it('should render centralized exchange information for CEX providers when enabled', async () => {
        const { getByText } = await renderProviderListItem(cexdirectFloatingQuote, {
            shouldShowExchangeType: true,
            tradingType: 'exchange',
        });

        expect(
            getByText(getTranslation('moduleTrading.providerListItem.centralizedExchange')),
        ).toBeOnTheScreen();
    });

    it('should render KYC information when provider has KYC policy', async () => {
        const { getByText } = await renderProviderListItem(cexdirectFloatingQuote, {
            tradingType: 'exchange',
        });

        expect(getByText(getTranslation('moduleTrading.kyc.kycRequired'))).toBeOnTheScreen();
    });

    it('should render no-identity-verification information for DEX providers', async () => {
        const { getByText } = await renderProviderListItem(invityDexQuote, {
            shouldShowExchangeType: true,
            tradingType: 'exchange',
        });

        expect(
            getByText(getTranslation('moduleTrading.providerListItem.noIdentityVerification')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.providerListItem.decentralizedExchange')),
        ).toBeOnTheScreen();
    });

    it('should not render when quote has no orderId', async () => {
        const { orderId, ...quoteWithoutOrderId } = mercuryoApplePayBuyQuote;
        const quote = quoteWithoutOrderId as TradingTradeType;

        const { queryByText } = await renderProviderListItem(quote);

        expect(queryByText('TestProvider')).toBeNull();
    });

    it('should render KYC warning for buy quote', async () => {
        const { getByText } = await renderProviderListItem(mercuryoApplePayBuyQuote);

        expect(
            getByText(getTranslation('moduleTrading.providerListItem.kycRequired')),
        ).toBeOnTheScreen();
    });

    it('should render KYC warning for sell quote', async () => {
        const { getByText } = await renderProviderListItem(banxaCreditCardSellQuote, {
            tradingType: 'sell',
        });

        expect(
            getByText(getTranslation('moduleTrading.providerListItem.kycRequired')),
        ).toBeOnTheScreen();
    });
});
