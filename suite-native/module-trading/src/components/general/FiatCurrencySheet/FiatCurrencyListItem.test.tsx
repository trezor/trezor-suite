import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { FiatCurrencyListItem, type FiatCurrencyListItemProps } from './FiatCurrencyListItem';

describe('FiatCurrencyListItem', () => {
    const renderFiatCurrencyListItem = async (props: Partial<FiatCurrencyListItemProps>) =>
        await renderWithBasicProvider(
            <FiatCurrencyListItem
                label="LABEL"
                displayValue="DISPLAY_VALUE"
                value="usd"
                onPress={jest.fn()}
                {...props}
            />,
        );

    it('should render label and display value', async () => {
        const { getByText } = await renderFiatCurrencyListItem({});

        expect(getByText('LABEL')).toBeTruthy();
        expect(getByText('DISPLAY_VALUE')).toBeTruthy();
    });

    it('should call onPress callback when pressed', async () => {
        const onPress = jest.fn();
        const { getByText } = await renderFiatCurrencyListItem({ onPress });

        await fireEvent.press(getByText('LABEL'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
