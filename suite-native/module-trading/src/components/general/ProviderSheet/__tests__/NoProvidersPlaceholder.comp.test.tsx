import { renderWithBasicProvider } from '@suite-native/test-utils';

import { NoProvidersPlaceholder } from '../NoProvidersPlaceholder';

describe('NoProvidersPlaceholder', () => {
    const renderNoProvidersPlaceholder = () => renderWithBasicProvider(<NoProvidersPlaceholder />);

    it('should render text and icon with label', () => {
        const { getByLabelText, getByText } = renderNoProvidersPlaceholder();

        expect(getByText('No offers available.')).toBeOnTheScreen();
        expect(getByLabelText('No offers available.')).toBeOnTheScreen();
    });
});
