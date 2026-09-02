import { nonSanctionedRegional } from '@suite-common/trading';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { CountryListItem, type CountryListItemProps } from './CountryListItem';

describe('CountryListItem', () => {
    const usData = nonSanctionedRegional.countriesOptionsMap.get('US')!;

    const renderCountryListItem = async (props: Partial<CountryListItemProps>) =>
        await renderWithBasicProvider(
            <CountryListItem onPress={jest.fn()} {...usData} {...props} />,
        );

    it('should render flag and name', async () => {
        const { getByLabelText, getByText } = await renderCountryListItem({});

        expect(getByLabelText('flag-US')).toBeOnTheScreen();
        expect(getByText('United States of America')).toBeOnTheScreen();
    });

    it('should call onPress callback on item press', async () => {
        const onPress = jest.fn();
        const { getByLabelText } = await renderCountryListItem({ onPress });

        await fireEvent.press(getByLabelText('flag-US'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
