import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { KYCWarning } from './KYCWarning';

describe('KYCWarning', () => {
    it('should render KYC info ', async () => {
        const { getByText } = await renderWithBasicProvider(<KYCWarning />);

        expect(
            getByText(getTranslation('moduleTrading.tradingScreen.kycRequired')),
        ).toBeOnTheScreen();
    });
});
