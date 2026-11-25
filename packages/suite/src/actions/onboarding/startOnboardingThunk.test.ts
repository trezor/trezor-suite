import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { locksInitialState, locksReducer } from '@suite/locks';
import { modalReducer, openModal } from '@suite/modal';
import { recoveryReducer } from '@suite/recovery';
import { routerLocationChange, routerReducer } from '@suite/router';
import { createRouterStateMockForRoute, mockSuiteRouterHistory } from '@suite/router/mocks';
import { deviceInitialState } from '@suite-common/device';
import { defaultDevicePersistentData, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';
import { createMockDispatch } from '@trezor/redux-utils/mocks';
import { createDeferred } from '@trezor/utils';

import onboardingReducer from '#src/reducers/onboarding/onboardingReducer';

import { enableOnboardingReducer, goToStep, resetOnboarding } from './onboardingActions';
import {
    type StartOnboardingParams,
    type StartOnboardingThunkDeps,
    type StartOnboardingThunkState,
    startOnboardingThunk,
} from './startOnboardingThunk';

const getInitialState = (): StartOnboardingThunkState => ({
    locks: locksInitialState,
    modal: modalReducer(undefined, { type: 'init' }),
    router: routerReducer(undefined, { type: 'init' }),
    device: {
        ...deviceInitialState,
        selectedDevice: mockSuiteDevice(
            { connected: true, mode: 'initialize' },
            { initialized: false, internal_model: DeviceModelInternal.T3B1 },
        ),
    },
    persistentDeviceData: { devices: [] },
    onboarding: onboardingReducer(undefined, { type: 'init' }),
    recovery: recoveryReducer(undefined, { type: 'init' }),
});

const runStartOnboarding = async (
    state: StartOnboardingThunkState,
    params?: StartOnboardingParams,
) => {
    const extra: StartOnboardingThunkDeps = {
        services: {
            suiteRouterHistory: mockSuiteRouterHistory(),
            analytics: mockDesktopAnalytics(),
        },
    };
    const navigate = jest.spyOn(extra.services.suiteRouterHistory, 'navigate');
    let current = state;
    const getState = () => current;
    const { actions, dispatch, onDispatch } = createMockDispatch({ getState, extra });
    const subscription = onDispatch(action => {
        current = {
            ...current,
            router: routerReducer(current.router, action),
            locks: locksReducer(current.locks, action),
            onboarding: onboardingReducer(current.onboarding, action),
        };
    });

    await startOnboardingThunk(params)(dispatch, getState, extra);
    subscription.unsubscribe();

    return { actions, navigate, state: current, analytics: extra.services.analytics };
};

describe('startOnboardingThunk', () => {
    it('does not change onboarding state while navigation is blocked by a device prompt', async () => {
        const state = getInitialState();
        state.locks = { ...state.locks, ui: 1 };

        const { actions } = await runStartOnboarding(state, { shouldRestart: true });

        expect(actions).not.toContainEqual(resetOnboarding());
        expect(actions).not.toContainEqual(enableOnboardingReducer(true));
        expect(actions).not.toContainEqual(goToStep('security-check'));
    });

    it('clears unfinished onboarding state when starting from another route', async () => {
        const initial = getInitialState();
        initial.onboarding = {
            ...initial.onboarding,
            isActive: true,
            path: ['recovery'],
            activeStepId: 'set-pin',
            onboardingAnalytics: { seed: 'recovery-in-progress' },
        };
        const { actions, state } = await runStartOnboarding(initial);

        expect(actions).toContainEqual(resetOnboarding());
        expect(state.onboarding.path).toEqual([]);
        expect(state.onboarding.onboardingAnalytics.seed).toBeUndefined();
    });

    it('does not activate or report a start while a modal is open', async () => {
        const initial = getInitialState();
        initial.modal = modalReducer(
            initial.modal,
            openModal({ type: 'disable-tor', decision: createDeferred<boolean>() }),
        );

        const { state, analytics } = await runStartOnboarding(initial);

        expect(state.onboarding).toBe(initial.onboarding);
        expect(analytics.report).not.toHaveBeenCalled();
    });

    it('initializes a direct onboarding route using the saved manual check', async () => {
        const initial = getInitialState();
        initial.router = createRouterStateMockForRoute('onboarding-index');
        initial.persistentDeviceData.devices = [defaultDevicePersistentData];

        const { state, analytics } = await runStartOnboarding(initial);

        expect(state.onboarding.isActive).toBe(true);
        expect(state.onboarding.activeStepId).toBe('firmware');
        expect(analytics.report).toHaveBeenCalledTimes(1);
    });

    it('waits for acquisition before selecting the initial onboarding step', async () => {
        const initial = getInitialState();
        initial.router = createRouterStateMockForRoute('onboarding-index');
        initial.device.selectedDevice = mockSuiteDevice({
            type: 'unacquired',
            connected: true,
            transportSessionOwner: undefined,
            path: 'onboarding-acquisition-device',
        });

        const pending = await runStartOnboarding(initial);

        expect(pending.state.onboarding.isActive).toBe(false);
        expect(pending.analytics.report).not.toHaveBeenCalled();

        pending.state.device = {
            ...pending.state.device,
            selectedDevice: mockSuiteDevice(
                { connected: true, mode: 'initialize', path: 'onboarding-acquisition-device' },
                { initialized: false, internal_model: DeviceModelInternal.T3B1 },
            ),
        };
        const acquired = await runStartOnboarding(pending.state);

        expect(acquired.state.onboarding.isActive).toBe(true);
        expect(acquired.state.onboarding.activeStepId).toBe('security-check');
    });

    it('releases a foreground router lock before starting', async () => {
        const initial = getInitialState();
        initial.locks = { ...initial.locks, router: 1 };

        const { state } = await runStartOnboarding(initial);

        expect(state.router.app).toBe('onboarding');
        expect(state.onboarding.isActive).toBe(true);
    });

    it('preserves timing and recovery data when resuming recovery', async () => {
        const initial = getInitialState();
        initial.recovery = { ...initial.recovery, status: 'in-progress' };
        initial.onboarding = {
            ...initial.onboarding,
            path: ['recovery'],
            onboardingAnalytics: { startTime: 123, seed: 'recovery-in-progress' },
        };

        const { state, analytics } = await runStartOnboarding(initial);

        expect(analytics.report).not.toHaveBeenCalled();
        expect(state.onboarding.path).toEqual(['recovery']);
        expect(state.onboarding.onboardingAnalytics).toEqual(
            initial.onboarding.onboardingAnalytics,
        );
    });

    it.each([false, true])(
        'returns an onboarding route with an initialized device to connection checks (restart=%s)',
        async shouldRestart => {
            const initial = getInitialState();
            initial.router = createRouterStateMockForRoute('onboarding-index');
            initial.onboarding = { ...initial.onboarding, isActive: shouldRestart };
            initial.device.selectedDevice = mockSuiteDevice({ connected: true });

            const { state, analytics } = await runStartOnboarding(initial, { shouldRestart });

            expect(state.router.app).not.toBe('onboarding');
            expect(state.onboarding.isActive).toBe(false);
            expect(analytics.report).not.toHaveBeenCalled();
        },
    );

    it('enters onboarding at manual inspection for a device that has not passed it', async () => {
        const { actions, navigate } = await runStartOnboarding(getInitialState());

        expect(actions).toEqual(
            expect.arrayContaining([enableOnboardingReducer(true), goToStep('security-check')]),
        );
        expect(actions).toContainEqual(
            expect.objectContaining({
                type: routerLocationChange.type,
                payload: expect.objectContaining({ app: 'onboarding' }),
            }),
        );
        expect(navigate).not.toHaveBeenCalled();
    });

    it('starts manual inspection for a fresh bootloader without a device ID', async () => {
        const initial = getInitialState();
        initial.device.selectedDevice = mockSuiteDevice(
            { connected: true, mode: 'bootloader', firmware: 'none' },
            {
                initialized: false,
                bootloader_mode: true,
                firmware_present: false,
                device_id: null,
            },
        );

        const { state } = await runStartOnboarding(initial);

        expect(state.onboarding.isActive).toBe(true);
        expect(state.onboarding.activeStepId).toBe('security-check');
    });

    it('requires manual inspection again after a factory reset', async () => {
        const state = getInitialState();
        state.device.selectedDevice = mockSuiteDevice(
            { connected: true, mode: 'bootloader' },
            { initialized: false, bootloader_mode: true, firmware_present: false },
        );
        state.persistentDeviceData.devices = [defaultDevicePersistentData];

        const { actions } = await runStartOnboarding(state);

        expect(actions).toContainEqual(goToStep('security-check'));
    });

    it('leaves configured devices in the standalone connection-check flow', async () => {
        const state = getInitialState();
        state.device.selectedDevice = mockSuiteDevice({ connected: true });

        const { actions, navigate } = await runStartOnboarding(state);

        expect(actions).not.toContainEqual(enableOnboardingReducer(true));
        expect(navigate).not.toHaveBeenCalled();
    });

    it('does not restart an onboarding flow that is already open', async () => {
        const state = getInitialState();
        state.router = createRouterStateMockForRoute('onboarding-index');
        state.onboarding = { ...state.onboarding, isActive: true, activeStepId: 'set-pin' };

        const { actions, navigate } = await runStartOnboarding(state);

        expect(actions).not.toContainEqual(goToStep('security-check'));
        expect(navigate).not.toHaveBeenCalled();
    });

    it('respects the saved manual check when explicitly restarting an open onboarding flow', async () => {
        const state = getInitialState();
        state.router = createRouterStateMockForRoute('onboarding-index');
        state.persistentDeviceData.devices = [defaultDevicePersistentData];

        const { actions } = await runStartOnboarding(state, { shouldRestart: true });

        expect(actions).toEqual(
            expect.arrayContaining([
                resetOnboarding(),
                enableOnboardingReducer(true),
                goToStep('firmware'),
            ]),
        );
        expect(actions).not.toContainEqual(goToStep('security-check'));
    });
});
