import { type EXPERIMENTAL_FEATURES } from '@suite-native/experimental-features';
import { getTranslation } from '@suite-native/intl';
import { SettingsStackRoutes } from '@suite-native/navigation';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { SettingsExperimentalScreen } from './SettingsExperimentalScreen';

let mockExperimentalFeatures: typeof EXPERIMENTAL_FEATURES;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({
        name: SettingsStackRoutes.SettingsExperimental,
        key: SettingsStackRoutes.SettingsExperimental,
        params: {},
    }),
}));

jest.mock('@suite-native/experimental-features', () => ({
    ...jest.requireActual('@suite-native/experimental-features'),
    get EXPERIMENTAL_FEATURES() {
        return mockExperimentalFeatures;
    },
}));

const preloadedState = {
    appSettings: { experimentalFeatures: [] },
    messageSystem: {
        config: null,
        validMessages: { banner: [], context: [], modal: [], feature: [] },
        dismissedMessages: {},
    },
};

describe('SettingsExperimentalScreen', () => {
    const renderSettingsExperimentalScreen = async () =>
        await renderWithStoreProvider(<SettingsExperimentalScreen />, { preloadedState });

    beforeEach(() => {
        mockExperimentalFeatures = {
            slip24: {
                icon: 'signature',
                titleKey: 'moduleSettings.experimental.slip24.title',
                descriptionKey: 'moduleSettings.experimental.slip24.description',
            },
        };
    });

    it('should render a row for every configured experimental feature', async () => {
        const { getByText, queryByText } = await renderSettingsExperimentalScreen();

        expect(
            getByText(getTranslation('moduleSettings.experimental.slip24.title')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleSettings.experimental.slip24.description')),
        ).toBeOnTheScreen();
        expect(
            queryByText(getTranslation('moduleSettings.experimental.noneAvailable.title')),
        ).toBeNull();
    });

    it('should render the empty state when no experimental feature is configured', async () => {
        mockExperimentalFeatures = {};

        const { getByText, queryByText } = await renderSettingsExperimentalScreen();

        expect(
            getByText(getTranslation('moduleSettings.experimental.noneAvailable.title')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleSettings.experimental.noneAvailable.subtitle')),
        ).toBeOnTheScreen();
        expect(queryByText(getTranslation('moduleSettings.experimental.slip24.title'))).toBeNull();
    });
});
