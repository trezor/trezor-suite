import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { FiatCurrencyButton, type FiatCurrencyButtonProps } from './FiatCurrencyButton';

describe('FiatCurrencyButton', () => {
    const renderFiatCurrencyButton = async (props: Partial<FiatCurrencyButtonProps>) =>
        await renderWithBasicProvider(
            <FiatCurrencyButton currency="czk" onPress={jest.fn()} {...props} />,
        );

    it('should render fiat currency uppercase', async () => {
        const { getByLabelText } = await renderFiatCurrencyButton({});

        expect(
            getByLabelText(getTranslation('moduleTrading.selectFiat.buttonTitle')),
        ).toHaveTextContent(/CZK/);
    });

    it('should call onPress callback when pressed', async () => {
        const onPress = jest.fn();
        const { getByLabelText } = await renderFiatCurrencyButton({ onPress });

        await fireEvent.press(
            getByLabelText(getTranslation('moduleTrading.selectFiat.buttonTitle')),
        );

        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
