import { act, fireEvent, render } from '@suite-native/test-utils';

import { CountryListItem, CountryListItemProps } from '../CountryListItem';

describe('CountryListItem', () => {
    const renderCountryListItem = (props: Partial<CountryListItemProps>) =>
        render(
            <CountryListItem
                flag="flag"
                id="US"
                isSelected={false}
                name="United States"
                onPress={jest.fn()}
                {...props}
            />,
        );

    it('should render given name', () => {
        const { getByText } = renderCountryListItem({ name: 'United States' });

        expect(getByText('United States')).toBeDefined();
    });

    it('should call onPress callback on item press', () => {
        const onPress = jest.fn();
        const { getByText } = renderCountryListItem({ onPress });

        act(() => {
            fireEvent.press(getByText('United States'));
        });

        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
