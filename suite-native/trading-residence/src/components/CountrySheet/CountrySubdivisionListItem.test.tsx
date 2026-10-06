import { type TradingCountrySubdivisionOption } from '@suite-common/trading';
import { renderWithBasicProvider } from '@suite-native/test-utils';
import { userEvent } from '@suite-native/test-utils-store';

import {
    CountrySubdivisionListItem,
    type CountrySubdivisionListItemProps,
} from './CountrySubdivisionListItem';

describe('CountrySubdivisionListItem', () => {
    const subdivisionData = {
        value: 'CA',
        label: 'California',
        name: 'California',
    } satisfies TradingCountrySubdivisionOption;

    const renderCountrySubdivisionListItem = async (
        props: Partial<CountrySubdivisionListItemProps>,
    ) =>
        await renderWithBasicProvider(
            <CountrySubdivisionListItem onPress={jest.fn()} {...subdivisionData} {...props} />,
        );

    it('should render the name', async () => {
        const { getByText } = await renderCountrySubdivisionListItem({});

        expect(getByText('California')).toBeOnTheScreen();
    });

    it('should call onPress on item press', async () => {
        const onPress = jest.fn();
        const { getByText } = await renderCountrySubdivisionListItem({ onPress });

        await userEvent.press(getByText('California'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
