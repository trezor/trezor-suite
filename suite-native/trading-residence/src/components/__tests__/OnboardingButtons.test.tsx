import {
    type TestStore,
    fireEvent,
    initStore,
    renderWithStoreProvider,
} from '@suite-native/test-utils';
import {
    selectTradingResidenceCountry,
    selectWasTradingResidenceOnboardingVisited,
} from '@suite-native/trading-state';

import { LocationForm } from '../LocationForm';
import { OnboardingButtons, type OnboardingButtonsProps } from '../OnboardingButtons';

describe('OnboardingButtons', () => {
    let store: TestStore;

    const renderOnboardingButtons = (props: OnboardingButtonsProps) =>
        renderWithStoreProvider(<OnboardingButtons {...props} />, {
            wrapper: LocationForm,
            store,
        });

    beforeEach(() => {
        store = initStore().store;
    });

    it('should render correctly', () => {
        const { getByText } = renderOnboardingButtons({ afterPress: () => {} });

        expect(getByText('Confirm location')).toBeOnTheScreen();
        expect(getByText('Not now')).toBeOnTheScreen();

        // make sure preconditions are met
        expect(selectTradingResidenceCountry(store.getState())).toBeUndefined();
        expect(selectWasTradingResidenceOnboardingVisited(store.getState())).toBe(false);
    });

    it('should dispatch setResidenceCountry and setOnboardingVisited on `Confirm location` press', () => {
        const afterPressMock = jest.fn();
        const { getByText } = renderOnboardingButtons({ afterPress: afterPressMock });

        fireEvent.press(getByText('Confirm location'));

        // from expo-localization mock
        expect(selectTradingResidenceCountry(store.getState())).toBe('PL');
        expect(selectWasTradingResidenceOnboardingVisited(store.getState())).toBe(true);
        expect(afterPressMock).toHaveBeenCalledTimes(1);
    });

    it('should dispatch only setOnboardingVisited on `Not now` press', () => {
        const afterPressMock = jest.fn();
        const { getByText } = renderOnboardingButtons({ afterPress: afterPressMock });

        fireEvent.press(getByText('Not now'));

        expect(selectTradingResidenceCountry(store.getState())).toBeUndefined();
        expect(selectWasTradingResidenceOnboardingVisited(store.getState())).toBe(true);
        expect(afterPressMock).toHaveBeenCalledTimes(1);
    });
});
