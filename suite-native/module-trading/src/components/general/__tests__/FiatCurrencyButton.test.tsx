import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { FiatCurrencyButton, FiatCurrencyButtonProps } from '../FiatCurrencyButton';

describe('FiatCurrencyButton', () => {
    const renderFiatCurrencyButton = (props: Partial<FiatCurrencyButtonProps>) =>
        renderWithBasicProvider(
            <FiatCurrencyButton currency="czk" onPress={jest.fn()} {...props} />,
        );

    it('should render fiat currency uppercase', () => {
        const { getByLabelText } = renderFiatCurrencyButton({});

        expect(getByLabelText('Select fiat currency')).toHaveTextContent(/CZK/);
    });

    it('should call onPress callback when pressed', () => {
        const onPress = jest.fn();
        const { getByLabelText } = renderFiatCurrencyButton({ onPress });

        fireEvent.press(getByLabelText('Select fiat currency'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
