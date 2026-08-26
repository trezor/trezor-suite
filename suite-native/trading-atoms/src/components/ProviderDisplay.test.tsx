import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { ProviderDisplay } from './ProviderDisplay';

describe('ProviderDisplay', () => {
    it('renders the provider logo and name accessibly', () => {
        const { getByLabelText, getByTestId, getByText } = renderWithBasicProvider(
            <ProviderDisplay
                accessibilityLabel="Selected provider"
                logo="mercuryo.png"
                providerName="Mercuryo"
                testID="@test/provider"
            />,
        );

        expect(getByLabelText(getTranslation('tradingAtoms.providerLogo'))).toBeOnTheScreen();
        expect(getByLabelText('Selected provider')).toBeOnTheScreen();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
        expect(getByTestId('@test/provider')).toBeOnTheScreen();
    });

    it('renders the provider name without a logo', () => {
        const { getByText, queryByLabelText } = renderWithBasicProvider(
            <ProviderDisplay providerName="Unknown provider" />,
        );

        expect(getByText('Unknown provider')).toBeOnTheScreen();
        expect(queryByLabelText(getTranslation('tradingAtoms.providerLogo'))).not.toBeOnTheScreen();
    });
});
