import { act, fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { CountryListItem, CountryListItemProps } from '../CountryListItem';

describe('CountryListItem', () => {
    const renderCountryListItem = (props: Partial<CountryListItemProps>) =>
        renderWithBasicProvider(
            <CountryListItem
                value="US"
                isSelected={false}
                label="🇺🇸 United States of America"
                onPress={jest.fn()}
                {...props}
            />,
        );
    it('should render given name', () => {
        const { getByText } = renderCountryListItem({ label: '🇺🇸 United States of America' });

        expect(getByText('🇺🇸 United States of America')).toBeTruthy();
    });

    it('should call onPress callback on item press', () => {
        const onPress = jest.fn();
        const { getByText } = renderCountryListItem({ onPress });

        act(() => {
            fireEvent.press(getByText('🇺🇸 United States of America'));
        });

        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
