import { TradingProviderInfo, TradingTradeType } from '@suite-common/trading';
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getInitializedTradingStateWithQuotes } from '../../../../__fixtures__/tradingState';
import { ProviderListItem, ProviderListItemProps } from '../ProviderListItem';

describe('ProviderListItem', () => {
    const renderProviderListItem = (
        quote: TradingTradeType,
        preloadedState: PreloadedState = {},
        props?: Partial<ProviderListItemProps<TradingTradeType>>,
    ) =>
        renderWithStoreProviderAsync(
            <ProviderListItem
                isSelected={false}
                onPress={jest.fn()}
                quote={quote}
                provider={
                    {
                        companyName: '',
                        logo: '',
                    } as TradingProviderInfo
                }
                {...props}
            />,
            { preloadedState },
        );

    it('should render provider information correctly', async () => {
        const preloadedState = { wallet: { tradingNew: getInitializedTradingStateWithQuotes() } };
        const quote = preloadedState.wallet.tradingNew.buy.quotes[0];

        const { queryByText } = await renderProviderListItem(quote, preloadedState, {
            provider: {
                companyName: 'TestProvider',
                logo: '',
            } as TradingProviderInfo,
        });

        expect(queryByText('TestProvider')).toBeTruthy();
    });

    it('should render trading information with formatted strings', async () => {
        const preloadedState = { wallet: { tradingNew: getInitializedTradingStateWithQuotes() } };
        const quote = preloadedState.wallet.tradingNew.buy.quotes[0];

        const { queryByText } = await renderProviderListItem(quote, preloadedState, {
            provider: {
                companyName: 'TestProvider',
                logo: '',
            } as TradingProviderInfo,
        });

        expect(queryByText('Rate')).toBeTruthy();
        expect(queryByText('You get')).toBeTruthy();
    });

    it('should render KYC information when provider has KYC policy', async () => {
        const preloadedState = { wallet: { tradingNew: getInitializedTradingStateWithQuotes() } };
        const quote = preloadedState.wallet.tradingNew.buy.quotes[0];

        const { queryByText } = await renderProviderListItem(quote, preloadedState, {
            provider: {
                companyName: 'TestProvider',
                logo: '',
                kycPolicyType: 'KYC-required',
            } as TradingProviderInfo,
        });

        expect(queryByText('This provider requires to verify identity.')).toBeTruthy();
    });

    it('should render anonymous information for DEX providers', async () => {
        const preloadedState = { wallet: { tradingNew: getInitializedTradingStateWithQuotes() } };
        const quote = preloadedState.wallet.tradingNew.buy.quotes[0];

        const { queryByText } = await renderProviderListItem(quote, preloadedState, {
            provider: {
                companyName: 'TestDEX',
                logo: '',
                kycPolicyType: 'DEX',
            } as TradingProviderInfo,
        });

        expect(queryByText('Anonymous')).toBeTruthy();
        expect(queryByText('Decentralized exchange')).toBeTruthy();
    });

    it('should not render when quote has no orderId', async () => {
        const preloadedState = { wallet: { tradingNew: getInitializedTradingStateWithQuotes() } };
        const baseQuote = preloadedState.wallet.tradingNew.buy.quotes[0];
        const { orderId, ...quoteWithoutOrderId } = baseQuote;
        const quote = quoteWithoutOrderId as TradingTradeType;

        const { queryByText } = await renderProviderListItem(quote, preloadedState, {
            provider: {
                companyName: 'TestProvider',
                logo: '',
            } as TradingProviderInfo,
        });

        expect(queryByText('TestProvider')).toBeNull();
    });
});
