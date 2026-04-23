import { nonSanctionedRegional } from '@suite-common/trading';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { CountryListItem, type CountryListItemProps } from '../CountryListItem';

describe('CountryListItem', () => {
    const usData = nonSanctionedRegional.countriesOptionsMap.get('US')!;

    const renderCountryListItem = (props: Partial<CountryListItemProps>) =>
        renderWithBasicProvider(
            <CountryListItem isSelected={false} onPress={jest.fn()} {...usData} {...props} />,
        );

    it('should render flag and name', () => {
        const { getByLabelText, getByText } = renderCountryListItem({});

        expect(getByLabelText('flag-US')).toBeOnTheScreen();
        expect(getByText('United States of America')).toBeOnTheScreen();
    });

    it('should call onPress callback on item press', () => {
        const onPress = jest.fn();
        const { getByLabelText } = renderCountryListItem({ onPress });

        fireEvent.press(getByLabelText('flag-US'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
