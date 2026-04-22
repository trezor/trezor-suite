import { renderWithProviders } from '@suite-native/test-utils';

import { NoProvidersPlaceholder } from '../NoProvidersPlaceholder';

describe('NoProvidersPlaceholder', () => {
    const renderNoProvidersPlaceholder = () =>
        renderWithProviders(<NoProvidersPlaceholder />, { providers: ['intl'] });

    it('should render text and icon with label', () => {
        const { getByLabelText, getByText } = renderNoProvidersPlaceholder();

        expect(getByText('No offers available.')).toBeOnTheScreen();
        expect(getByLabelText('No offers available.')).toBeOnTheScreen();
    });
});
