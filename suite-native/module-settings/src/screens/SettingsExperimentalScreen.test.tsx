import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { type EXPERIMENTAL_FEATURES } from '@suite-native/experimental-features';
import { featureFeedbackReducer } from '@suite-native/feature-feedback';
import { getTranslation, localeReducer } from '@suite-native/intl';
import { SettingsStackRoutes } from '@suite-native/navigation';
import {
    type ExperimentalFeature,
    appSettingsInitialState,
    appSettingsReducer,
    selectIsExperimentalFeatureEnabled,
} from '@suite-native/settings';
import {
    createLightStore,
    createStaticReducer,
    fireEvent,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';

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

const messageSystemState = {
    config: null,
    validMessages: { banner: [], context: [], modal: [], feature: [] },
    dismissedMessages: {},
};

describe('SettingsExperimentalScreen', () => {
    const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };

    const renderSettingsExperimentalScreen = async (
        experimentalFeatures: ExperimentalFeature[] = [],
    ) => {
        const store = createLightStore({
            reducer: {
                appSettings: appSettingsReducer,
                featureFeedback: featureFeedbackReducer,
                wallet: createStaticReducer({ settings: initialWalletSettingsState }),
                locale: localeReducer,
                messageSystem: createStaticReducer(messageSystemState),
            },
            preloadedState: { appSettings: { ...appSettingsInitialState, experimentalFeatures } },
        });

        return {
            ...(await renderWithStoreProvider(<SettingsExperimentalScreen />, {
                services: { ...services, store },
            })),
            store,
        };
    };

    beforeEach(() => {
        mockExperimentalFeatures = jest.requireActual<{
            EXPERIMENTAL_FEATURES: typeof EXPERIMENTAL_FEATURES;
        }>('@suite-native/experimental-features').EXPERIMENTAL_FEATURES;
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
            getByText(getTranslation('moduleSettings.experimental.nativeNavigation.title')),
        ).toHaveTextContent('Native navigation');
        expect(
            getByText(getTranslation('moduleSettings.experimental.nativeNavigation.description')),
        ).toBeOnTheScreen();
        expect(
            queryByText(getTranslation('moduleSettings.experimental.noneAvailable.title')),
        ).toBeNull();
    });

    it('should update native navigation immediately and request feedback when disabled', async () => {
        const { getByRole, store } = await renderSettingsExperimentalScreen(['slip24']);
        const getNativeNavigationSwitch = () =>
            getByRole('switch', { name: 'native-navigation toggle' });

        expect(getNativeNavigationSwitch()).not.toBeChecked();

        await fireEvent.press(getNativeNavigationSwitch());

        expect(getNativeNavigationSwitch()).toBeChecked();
        expect(selectIsExperimentalFeatureEnabled(store.getState(), 'native-navigation')).toBe(
            true,
        );
        expect(store.getState().featureFeedback.pendingFeedbackFeatures).toEqual([]);

        await fireEvent.press(getNativeNavigationSwitch());

        expect(getNativeNavigationSwitch()).not.toBeChecked();
        expect(store.getState().appSettings.experimentalFeatures).toEqual(['slip24']);
        expect(store.getState().featureFeedback.pendingFeedbackFeatures).toEqual([
            'native-navigation',
        ]);
    });

    it('should reflect native navigation restored from persisted settings', async () => {
        const { getByRole } = await renderSettingsExperimentalScreen(['native-navigation']);

        expect(getByRole('switch', { name: 'native-navigation toggle' })).toBeChecked();
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
        expect(
            queryByText(getTranslation('moduleSettings.experimental.nativeNavigation.title')),
        ).toBeNull();
    });
});
