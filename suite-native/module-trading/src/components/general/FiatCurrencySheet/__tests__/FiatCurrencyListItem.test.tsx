import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { FiatCurrencyListItem, FiatCurrencyListItemProps } from '../FiatCurrencyListItem';

describe('FiatCurrencyListItem', () => {
    const renderFiatCurrencyListItem = (props: Partial<FiatCurrencyListItemProps>) =>
        renderWithBasicProvider(
            <FiatCurrencyListItem
                label="LABEL"
                displayValue="DISPLAY_VALUE"
                onPress={jest.fn()}
                {...props}
            />,
        );

    it('should render label and display value', () => {
        const { getByText } = renderFiatCurrencyListItem({});

        expect(getByText('LABEL')).toBeTruthy();
        expect(getByText('DISPLAY_VALUE')).toBeTruthy();
    });

    it('should call onPress callback when pressed', () => {
        const onPress = jest.fn();
        const { getByText } = renderFiatCurrencyListItem({ onPress });

        fireEvent.press(getByText('LABEL'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
