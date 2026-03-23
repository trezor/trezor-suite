import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils';
import { getWalletState, sellQuotes } from '@suite-native/trading-fixtures';

import {
    SellToFiatTradePreviewCard,
    type SellToFiatTradePreviewCardProps,
} from '../SellToFiatTradePreviewCard';

describe('SellToFiatTradePreviewCard', () => {
    const renderSellToFiatTradePreviewCard = (
        props: Partial<SellToFiatTradePreviewCardProps> = {},
    ) => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'sell' }),
        };

        return renderWithStoreProvider(<SellToFiatTradePreviewCard {...props} />, {
            preloadedState,
        });
    };

    it('should render nothing when there is no quote', () => {
        const { toJSON } = renderSellToFiatTradePreviewCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when quote has no fiatCurrency', () => {
        const quoteWithoutFiat = { ...sellQuotes[0], fiatCurrency: undefined };
        const { toJSON } = renderSellToFiatTradePreviewCard({
            quote: quoteWithoutFiat,
        });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when quote has no paymentMethod', () => {
        const quoteWithoutPaymentMethod = { ...sellQuotes[0], paymentMethod: undefined };
        const { toJSON } = renderSellToFiatTradePreviewCard({
            quote: quoteWithoutPaymentMethod,
        });

        expect(toJSON()).toBeNull();
    });

    it('should render TradeFiatSideCard otherwise', () => {
        const { getByText } = renderSellToFiatTradePreviewCard({
            quote: sellQuotes[0],
        });

        expect(getByText('To')).toBeOnTheScreen();
        expect(getByText('Credit/Debit Card')).toBeOnTheScreen();
        expect(getByText('+$90.17')).toBeOnTheScreen();
    });

    it('should render bank transfer payment method', () => {
        const { getByText } = renderSellToFiatTradePreviewCard({
            quote: sellQuotes[1], // This quote has bankTransfer payment method
        });

        expect(getByText('To')).toBeOnTheScreen();
        expect(getByText('Bank Transfer')).toBeOnTheScreen();
        expect(getByText('+$100.00')).toBeOnTheScreen();
    });
});
