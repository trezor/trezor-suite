import { act, fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';
import {
    getInitializedTradingState,
    mercuryoApplePayBuyQuote,
} from '@suite-native/trading-fixtures';

import { PaymentMethodListItem, type PaymentMethodListItemProps } from '../PaymentMethodListItem';

describe('PaymentMethodListItem', () => {
    const getPreloadedState = () => ({ wallet: { trading: getInitializedTradingState() } });

    const renderPaymentMethodListItem = (props: Partial<PaymentMethodListItemProps<any>>) =>
        renderWithStoreProvider(
            <PaymentMethodListItem
                quote={mercuryoApplePayBuyQuote}
                onPress={jest.fn()}
                {...props}
            />,
            { preloadedState: getPreloadedState() },
        );

    it('should render given name and rate', () => {
        const { getByText } = renderPaymentMethodListItem({});

        expect(getByText('Apple Pay')).toBeOnTheScreen();
        expect(getByText('Rate')).toBeOnTheScreen();
        expect(getByText('€9,998.32 / 1 BTC')).toBeOnTheScreen();
    });

    it('should call onPress callback on item press', () => {
        const onPress = jest.fn();
        const { getByText } = renderPaymentMethodListItem({ onPress });

        act(() => {
            fireEvent.press(getByText('Apple Pay'));
        });

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should not render rate row when rate is unknown', () => {
        const { getByText, queryByText } = renderPaymentMethodListItem({
            quote: { ...mercuryoApplePayBuyQuote, rate: undefined, receiveStringAmount: undefined },
        });

        expect(getByText('Apple Pay')).toBeOnTheScreen();
        expect(queryByText('Rate')).toBeNull();
    });
});
