import { renderWithStoreProvider } from '@suite-native/test-utils';

import { GeneralSettings } from '../GeneralSettings';

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectIsTradingCountrySet: () => true,
    selectIsTradingResidenceCheckEnabled: () => true,
}));

describe('GeneralSettings', () => {
    const renderGeneralSettings = () => renderWithStoreProvider(<GeneralSettings />);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render trading settings button', () => {
        const { getByTestId } = renderGeneralSettings();

        expect(getByTestId('@settings/trading')).toBeOnTheScreen();
    });
});
