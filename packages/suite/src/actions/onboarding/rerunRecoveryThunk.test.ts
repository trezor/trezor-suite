import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { locksInitialState } from '@suite/locks';
import { modalReducer, openModal } from '@suite/modal';
import { recoveryReducer } from '@suite/recovery';
import { routerReducer } from '@suite/router';
import { createRouterStateMockForRoute, mockSuiteRouterHistory } from '@suite/router/mocks';
import { deviceInitialState } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import TrezorConnect from '@trezor/connect';
import { createDeferred } from '@trezor/utils';

import onboardingReducer from '#src/reducers/onboarding/onboardingReducer';
import { type OnboardingRootState } from '#src/reducers/onboarding/onboardingState';

import {
    type RerunRecoveryThunkDeps,
    type RerunRecoveryThunkState,
    rerunRecoveryThunk,
} from './onboardingActions';

type RecoveryResumeTestState = RerunRecoveryThunkState & OnboardingRootState;

const device = mockSuiteDevice(
    { mode: 'initialize', connected: true, available: true },
    { initialized: false, recovery_status: 'Recovery' },
);
if (!isDeviceAcquired(device)) throw new Error('Recovery fixture must be acquired.');

const setup = (blockedBy?: 'modal' | 'ui') => {
    const initialState: RecoveryResumeTestState = {
        router: createRouterStateMockForRoute('suite-index'),
        locks: { ...locksInitialState, ui: blockedBy === 'ui' ? 1 : 0 },
        modal: modalReducer(undefined, { type: 'init' }),
        onboarding: onboardingReducer(undefined, { type: 'init' }),
        recovery: recoveryReducer(undefined, { type: 'init' }),
        device: { ...deviceInitialState, selectedDevice: device },
    };
    if (blockedBy === 'modal')
        initialState.modal = modalReducer(
            initialState.modal,
            openModal({ type: 'disable-tor', decision: createDeferred<boolean>() }),
        );

    return createTestCompositionRoot<RerunRecoveryThunkDeps, RecoveryResumeTestState>({
        preloadedState: initialState,
        reducer: (state = initialState, action) => ({
            ...state,
            router: routerReducer(state.router, action),
            onboarding: onboardingReducer(state.onboarding, action),
            recovery: recoveryReducer(state.recovery, action),
        }),
        services: () => ({
            analytics: mockDesktopAnalytics(),
            suiteRouterHistory: mockSuiteRouterHistory(),
        }),
    }).services.store;
};

describe(rerunRecoveryThunk.name, () => {
    beforeEach(() => {
        jest.spyOn(TrezorConnect, 'getFeatures').mockResolvedValue({
            success: true,
            payload: device.features,
        });
        jest.spyOn(TrezorConnect, 'recoveryDevice').mockResolvedValue({
            success: true,
            payload: { message: 'Success' },
        });
    });
    afterEach(() => jest.restoreAllMocks());

    it.each(['modal', 'ui'] as const)(
        'does not activate onboarding when navigation is blocked by %s',
        async blockedBy => {
            const store = setup(blockedBy);
            const initial = store.getState().onboarding;

            await store.dispatch(rerunRecoveryThunk());

            expect(store.getState().router.app).not.toBe('onboarding');
            expect(store.getState().onboarding).toEqual(initial);
        },
    );

    it('only activates recovery after entering the onboarding route', async () => {
        const store = setup();
        const activeOutsideOnboarding: string[] = [];
        const unsubscribe = store.subscribe(() => {
            if (
                store.getState().onboarding.isActive &&
                store.getState().router.app !== 'onboarding'
            )
                activeOutsideOnboarding.push(store.getState().router.app);
        });

        await store.dispatch(rerunRecoveryThunk());
        unsubscribe();

        expect(activeOutsideOnboarding).toEqual([]);
        expect(store.getState().router.app).toBe('onboarding');
        expect(store.getState().onboarding).toMatchObject({
            isActive: true,
            activeStepId: 'recovery',
            path: ['recovery'],
        });
    });
});
