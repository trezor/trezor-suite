import { TradingTradeType, TradingType } from '@suite-common/trading';
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import buyQuotes from '../../../../__fixtures__/buyQuotes.json';
import { getWalletState } from '../../../../__fixtures__/walletState';
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

    it('should render provided quotes', async () => {
        const { queryByText, getByText } = await renderProviderSheet(
            { quotes: { fixed: [buyQuotes[0]] } },
            { wallet: getWalletState() },
        );

        expect(queryByText('No offers available.')).toBeNull();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });
});
