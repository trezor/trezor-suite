import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';

import { type FlagsState, flagsInitialState, prepareFlagsReducer } from '../flagsSlice';
import { initialRunCompleted } from '../flagsThunks';

const flagsReducer = prepareFlagsReducer(extraDependenciesCommonMock);

const initStore = (flags?: Partial<FlagsState>) =>
    configureMockStore({
        extra: extraDependenciesCommonMock,
        reducer: { flags: flagsReducer },
        preloadedState: { flags: { ...flagsInitialState, ...flags } },
    });

describe('initialRunCompleted', () => {
    it('should set initialRun to false when initialRun is true', async () => {
        const store = initStore();
        await store.dispatch(initialRunCompleted());
        expect(store.getState().flags.initialRun).toBe(false);
    });

    it('should set initialRun to false when initialRun is already false', async () => {
        const store = initStore({ initialRun: false });
        await store.dispatch(initialRunCompleted());
        expect(store.getState().flags.initialRun).toBe(false);
    });

    it('should make a freshly onboarded user eligible for the onboarding feedback banner', async () => {
        const store = initStore({ showOnboardingFeedbackBanner: false });
        await store.dispatch(initialRunCompleted());
        expect(store.getState().flags.showOnboardingFeedbackBanner).toBe(true);
    });

    it('should not show the onboarding feedback banner for a returning user (initialRun already false)', async () => {
        const store = initStore({ initialRun: false, showOnboardingFeedbackBanner: false });
        await store.dispatch(initialRunCompleted());
        expect(store.getState().flags.showOnboardingFeedbackBanner).toBe(false);
    });
});
