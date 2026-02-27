import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { getWalletState, sellQuotes } from '@suite-native/trading-fixtures';

import {
    SellToFiatTradePreviewCard,
    SellToFiatTradePreviewCardProps,
} from '../SellToFiatTradePreviewCard';

describe('SellToFiatTradePreviewCard', () => {
    const renderSellToFiatTradePreviewCard = (
        props: Partial<SellToFiatTradePreviewCardProps> = {},
    ) => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'sell' }),
        };

        return renderWithStoreProviderAsync(<SellToFiatTradePreviewCard {...props} />, {
            preloadedState,
        });
    };

    it('should render nothing when there is no quote', async () => {
        const { toJSON } = await renderSellToFiatTradePreviewCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when quote has no fiatCurrency', async () => {
        const quoteWithoutFiat = { ...sellQuotes[0], fiatCurrency: undefined };
        const { toJSON } = await renderSellToFiatTradePreviewCard({
            quote: quoteWithoutFiat,
        });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when quote has no paymentMethod', async () => {
        const quoteWithoutPaymentMethod = { ...sellQuotes[0], paymentMethod: undefined };
        const { toJSON } = await renderSellToFiatTradePreviewCard({
            quote: quoteWithoutPaymentMethod,
        });

        expect(toJSON()).toBeNull();
    });

    it('should render TradeFiatSideCard otherwise', async () => {
        const { getByText } = await renderSellToFiatTradePreviewCard({
            quote: sellQuotes[0],
        });

        expect(getByText('To')).toBeOnTheScreen();
        expect(getByText('Credit/Debit Card')).toBeOnTheScreen();
        expect(getByText('+$90.17')).toBeOnTheScreen();
    });

    it('should render bank transfer payment method', async () => {
        const { getByText } = await renderSellToFiatTradePreviewCard({
            quote: sellQuotes[1], // This quote has bankTransfer payment method
        });

        expect(getByText('To')).toBeOnTheScreen();
        expect(getByText('Bank Transfer')).toBeOnTheScreen();
        expect(getByText('+$100.00')).toBeOnTheScreen();
    });
});
