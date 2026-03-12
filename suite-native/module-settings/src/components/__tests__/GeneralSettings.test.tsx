import { renderWithStoreProviderAsync } from '@suite-native/test-utils/store';

import { GeneralSettings } from '../GeneralSettings';

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectIsTradingCountrySet: () => true,
    selectIsTradingResidenceCheckEnabled: () => true,
}));

describe('GeneralSettings', () => {
    const renderGeneralSettings = () => renderWithStoreProviderAsync(<GeneralSettings />);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render trading settings button', async () => {
        const { getByTestId } = await renderGeneralSettings();

        expect(getByTestId('@settings/trading')).toBeOnTheScreen();
    });
});
