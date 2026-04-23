import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import {
    banxaBankTransferSellQuote,
    banxaCreditCardSellQuote,
    getWalletState,
} from '@suite-native/trading-fixtures';

import {
    SellToFiatTradePreviewCard,
    type SellToFiatTradePreviewCardProps,
} from '../SellToFiatTradePreviewCard';

describe('SellToFiatTradePreviewCard', () => {
    const renderSellToFiatTradePreviewCard = (
        props: Partial<SellToFiatTradePreviewCardProps> = {},
    ) => {
        const preloadedState = {
            wallet: getWalletState({ tradeType: 'sell' }),
        };

        return renderWithStoreProvider(<SellToFiatTradePreviewCard {...props} />, {
            preloadedState,
            providers: ['intl', 'formatter'],
        });
    };

    it('should render nothing when there is no quote', () => {
        const { toJSON } = renderSellToFiatTradePreviewCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when quote has no fiatCurrency', () => {
        const quoteWithoutFiat = { ...banxaCreditCardSellQuote, fiatCurrency: undefined };
        const { toJSON } = renderSellToFiatTradePreviewCard({
            quote: quoteWithoutFiat,
        });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when quote has no paymentMethod', () => {
        const quoteWithoutPaymentMethod = {
            ...banxaCreditCardSellQuote,
            paymentMethod: undefined,
        };
        const { toJSON } = renderSellToFiatTradePreviewCard({
            quote: quoteWithoutPaymentMethod,
        });

        expect(toJSON()).toBeNull();
    });

    it('should render TradeFiatSideCard otherwise', () => {
        const { getByText } = renderSellToFiatTradePreviewCard({
            quote: banxaCreditCardSellQuote,
        });

        expect(getByText('To')).toBeOnTheScreen();
        expect(getByText('Credit/Debit Card')).toBeOnTheScreen();
        expect(getByText('+$90.17')).toBeOnTheScreen();
    });

    it('should render bank transfer payment method', () => {
        const { getByText } = renderSellToFiatTradePreviewCard({
            quote: banxaBankTransferSellQuote,
        });

        expect(getByText('To')).toBeOnTheScreen();
        expect(getByText('Bank Transfer')).toBeOnTheScreen();
        expect(getByText('+$100.00')).toBeOnTheScreen();
    });
});
