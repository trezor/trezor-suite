import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { GeneralSettings } from '../GeneralSettings';

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectIsTradingCountrySet: () => true,
    selectIsTradingResidenceCheckEnabled: () => true,
}));

describe('GeneralSettings', () => {
    const renderGeneralSettings = () =>
        renderWithStoreProvider(<GeneralSettings />, { providers: ['intl', 'navigation'] });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render trading settings button', () => {
        const { getByTestId } = renderGeneralSettings();

        expect(getByTestId('@settings/trading')).toBeOnTheScreen();
    });
});
