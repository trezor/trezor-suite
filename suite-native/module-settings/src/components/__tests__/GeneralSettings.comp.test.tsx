import { act, renderWithStoreProviderAsync, userEvent } from '@suite-native/test-utils';

import { GeneralSettings } from '../GeneralSettings';

const mockNavigate = jest.fn();

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectIsTradingCountrySet: () => true,
    selectIsTradingResidenceCheckEnabled: () => true,
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

describe('GeneralSettings', () => {
    const renderGeneralSettings = () => renderWithStoreProviderAsync(<GeneralSettings />);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render trading settings button', async () => {
        const { getByTestId } = await renderGeneralSettings();

        expect(getByTestId('@settings/trading')).toBeOnTheScreen();

        await act(async () => {
            await userEvent.press(getByTestId('@settings/trading'));
        });

        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('SettingsScreenStack', {
            screen: 'SettingsTradingLocation',
        });
    });
});
