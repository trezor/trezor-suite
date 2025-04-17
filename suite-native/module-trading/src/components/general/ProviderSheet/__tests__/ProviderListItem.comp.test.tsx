import { TradingTradeType } from '@suite-common/trading';
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getInitializedTradingStateWithQuotes } from '../../../../__fixtures__/tradingState';
import { ProviderListItem, ProviderListItemProps } from '../ProviderListItem';

describe('ProviderListItem', () => {
    const renderProviderListItem = (
        quote: TradingTradeType,
        preloadedState: PreloadedState = {},
        props?: Partial<ProviderListItemProps>,
    ) =>
        renderWithStoreProviderAsync(
            <ProviderListItem
                orderId={quote.orderId ?? ''}
                isSelected={false}
                onPress={jest.fn()}
                companyName=""
                logo=""
                {...props}
            />,
            { preloadedState },
        );

    it('should render provider information correctly', async () => {
        const preloadedState = { wallet: { tradingNew: getInitializedTradingStateWithQuotes() } };
        const quote = preloadedState.wallet.tradingNew.buy.quotes[0];

        const { queryByText } = await renderProviderListItem(quote, preloadedState, {
            companyName: 'tstName',
        });

        expect(queryByText('tstName')).toBeDefined();
    });
});
