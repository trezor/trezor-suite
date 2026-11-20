import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { GeneralSettings } from './GeneralSettings';

jest.mock('@suite-native/trading-shared', () => ({
    ...jest.requireActual('@suite-native/trading-shared'),
    selectIsTradingCountrySet: () => true,
    selectIsTradingResidenceSelectionAvailable: () => true,
}));

describe('GeneralSettings', () => {
    const renderGeneralSettings = () => renderWithStoreProvider(<GeneralSettings />);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render trading settings button', async () => {
        const { getByTestId } = await renderGeneralSettings();

        expect(getByTestId('@settings/trading')).toBeOnTheScreen();
    });
});
