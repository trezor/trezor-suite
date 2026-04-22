import { renderWithProviders } from '@suite-native/test-utils';

import {
    MyAssetsDisabledListItem,
    type MyAssetsDisabledListItemProps,
} from '../MyAssetsDisabledListItem';

describe('MyAssetsDisabledListItem', () => {
    const renderMyAssetsDisabledListItem = (props: MyAssetsDisabledListItemProps) =>
        renderWithProviders(<MyAssetsDisabledListItem {...props} />, { providers: ['intl'] });

    it.each<[number, string]>([
        [1, '+ 1 non-tradeable token'],
        [2, '+ 2 non-tradeable tokens'],
        [1000, '+ 1,000 non-tradeable tokens'],
    ])('should render correct text for count %d', (count, expectedContent) => {
        const { getByText } = renderMyAssetsDisabledListItem({ count });

        expect(getByText(expectedContent)).toBeOnTheScreen();
    });
});
