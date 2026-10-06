import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';

import {
    type FlagsRootState,
    type FlagsState,
    flagsInitialState,
    prepareFlagsReducer,
} from './flagsSlice';
import { initialRunCompletedThunk } from './flagsThunks';

const flagsReducer = prepareFlagsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadFlags: mockReducer() },
});

// The thunk has no state dependency; the reducer slice lets the test assert its effect.
const initStore = (flags?: Partial<FlagsState>) =>
    createTestCompositionRoot<void, FlagsRootState>({
        reducer: { flags: flagsReducer },
        preloadedState: { flags: { ...flagsInitialState, ...flags } },
    }).services.store;

describe('initialRunCompleted', () => {
    it('should set initialRun to false when initialRun is true', async () => {
        const store = initStore();
        await store.dispatch(initialRunCompletedThunk({ isFreshDeviceSetup: true }));
        expect(store.getState().flags.initialRun).toBe(false);
    });

    it('should set initialRun to false when initialRun is already false', async () => {
        const store = initStore({ initialRun: false });
        await store.dispatch(initialRunCompletedThunk({ isFreshDeviceSetup: false }));
        expect(store.getState().flags.initialRun).toBe(false);
    });

    it('should make a freshly set up device eligible for the onboarding feedback banner', async () => {
        const store = initStore({ showOnboardingFeedbackBanner: false });
        await store.dispatch(initialRunCompletedThunk({ isFreshDeviceSetup: true }));
        expect(store.getState().flags.showOnboardingFeedbackBanner).toBe(true);
    });

    it('should re-enable the onboarding feedback banner when a returning user sets up a device again', async () => {
        const store = initStore({ initialRun: false, showOnboardingFeedbackBanner: false });
        await store.dispatch(initialRunCompletedThunk({ isFreshDeviceSetup: true }));
        expect(store.getState().flags.showOnboardingFeedbackBanner).toBe(true);
    });

    it('should not enable the onboarding feedback banner when only pairing an already set up device', async () => {
        const store = initStore({ showOnboardingFeedbackBanner: false });
        await store.dispatch(initialRunCompletedThunk({ isFreshDeviceSetup: false }));
        expect(store.getState().flags.showOnboardingFeedbackBanner).toBe(false);
    });
});
