import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { FiatCurrencyButton, type FiatCurrencyButtonProps } from './FiatCurrencyButton';

describe('FiatCurrencyButton', () => {
    const renderFiatCurrencyButton = (props: Partial<FiatCurrencyButtonProps>) =>
        renderWithBasicProvider(
            <FiatCurrencyButton currency="czk" onPress={jest.fn()} {...props} />,
        );

    it('should render fiat currency uppercase', () => {
        const { getByLabelText } = renderFiatCurrencyButton({});

        expect(
            getByLabelText(getTranslation('moduleTrading.selectFiat.buttonTitle')),
        ).toHaveTextContent(/CZK/);
    });

    it('should call onPress callback when pressed', () => {
        const onPress = jest.fn();
        const { getByLabelText } = renderFiatCurrencyButton({ onPress });

        fireEvent.press(getByLabelText(getTranslation('moduleTrading.selectFiat.buttonTitle')));

        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
