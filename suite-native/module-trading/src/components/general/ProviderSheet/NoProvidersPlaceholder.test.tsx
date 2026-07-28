import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { NoProvidersPlaceholder } from './NoProvidersPlaceholder';

describe('NoProvidersPlaceholder', () => {
    const renderNoProvidersPlaceholder = () => renderWithBasicProvider(<NoProvidersPlaceholder />);

    it('should render text and icon with label', () => {
        const { getByLabelText, getByText } = renderNoProvidersPlaceholder();

        expect(
            getByText(getTranslation('moduleTrading.providerSheet.noProviders')),
        ).toBeOnTheScreen();
        expect(
            getByLabelText(getTranslation('moduleTrading.providerSheet.noProviders')),
        ).toBeOnTheScreen();
    });
});
