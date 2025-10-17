import {
    TestStore,
    fireEvent,
    initStore,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import {
    selectTradingResidenceCountry,
    selectWasTradingResidenceOnboardingVisited,
} from '../../selectors/residenceSelectors';
import { LocationForm } from '../LocationForm';
import { OnboardingButtons } from '../OnboardingButtons';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        goBack: () => jest.fn(),
    }),
}));

describe('OnboardingButtons', () => {
    let store: TestStore;

    const renderOnboardingButtons = () =>
        renderWithStoreProviderAsync(<OnboardingButtons />, { wrapper: LocationForm, store });

    beforeEach(async () => {
        store = await initStore();
    });

    it('should render correctly', async () => {
        const { getByText } = await renderOnboardingButtons();

        expect(getByText('Confirm location')).toBeOnTheScreen();
        expect(getByText('Not now')).toBeOnTheScreen();

        // make sure preconditions are met
        expect(selectTradingResidenceCountry(store.getState())).toBeUndefined();
        expect(selectWasTradingResidenceOnboardingVisited(store.getState())).toBe(false);
    });

    it('should dispatch setResidenceCountry and setOnboardingVisited on `Confirm location` press', async () => {
        const { getByText } = await renderOnboardingButtons();

        fireEvent.press(getByText('Confirm location'));

        // from expo-localization mock
        expect(selectTradingResidenceCountry(store.getState())).toBe('PL');
        expect(selectWasTradingResidenceOnboardingVisited(store.getState())).toBe(true);
    });

    it('should dispatch only setOnboardingVisited on `Not now` press', async () => {
        const { getByText } = await renderOnboardingButtons();

        fireEvent.press(getByText('Not now'));

        expect(selectTradingResidenceCountry(store.getState())).toBeUndefined();
        expect(selectWasTradingResidenceOnboardingVisited(store.getState())).toBe(true);
    });
});
