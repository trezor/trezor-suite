import { mockSuiteDevice } from '@suite-common/suite-types/mocks';

import * as onboardingActions from 'src/actions/onboarding/onboardingActions';
import * as STEP from 'src/constants/onboarding/steps';
import onboardingReducer from 'src/reducers/onboarding/onboardingReducer';

export default [
    {
        description: 'goToNextStep (without param)',
        initialState: {
            device: mockSuiteDevice(),
        },
        action: () => onboardingActions.goToNextStep(),
        expect: {
            toMatchObject: { activeStepId: STEP.ID_AUTHENTICATE_DEVICE_STEP },
        },
    },
    {
        description: 'goToNextStep (with param)',
        initialState: {
            device: mockSuiteDevice(),
        },
        action: () => onboardingActions.goToNextStep('firmware'),
        expect: {
            toMatchObject: { activeStepId: STEP.ID_FIRMWARE_STEP },
        },
    },
    {
        description: 'goToNextStep: from backup step skip set-pin when pin is already set',
        initialState: {
            onboarding: {
                activeStepId: STEP.ID_SECURITY_STEP,
            },
            device: {
                selectedDevice: mockSuiteDevice(undefined, {
                    pin_protection: true,
                }),
            },
        },
        action: () => onboardingActions.goToNextStep(),
        expect: {
            toMatchObject: { activeStepId: STEP.ID_COINS_STEP },
        },
    },
    {
        description: 'goToPreviousStep',
        initialState: {
            onboarding: {
                activeStepId: STEP.ID_RECOVERY_STEP,
            },
        },
        action: () => onboardingActions.goToPreviousStep(),
        expect: {
            toMatchObject: { activeStepId: STEP.ID_RESET_DEVICE_STEP },
        },
    },
    {
        description: 'addPath: should add unique entry',
        initialState: {
            onboarding: {
                path: ['new'],
            },
            device: mockSuiteDevice(),
        },
        action: () => onboardingActions.addPath('create'),
        expect: {
            toMatchObject: { path: ['new', 'create'] },
        },
    },
    {
        description: 'addPath: should add duplicit entry',
        initialState: {
            onboarding: {
                path: ['create'],
            },
            device: mockSuiteDevice(),
        },
        action: () => onboardingActions.addPath('create'),
        expect: {
            toMatchObject: { path: ['create'] },
        },
    },
    {
        description: 'removePath: one element',
        initialState: {
            onboarding: {
                path: ['create'],
            },
        },
        action: () => onboardingActions.removePath(['create']),
        expect: {
            toMatchObject: { path: [] },
        },
    },
    {
        description: 'removePath: multiple elements',
        initialState: {
            onboarding: {
                path: ['create', 'recovery'],
            },
            device: mockSuiteDevice(),
        },
        action: () => onboardingActions.removePath(['recovery']),
        expect: {
            toMatchObject: { path: ['create'] },
        },
    },
    {
        description: 'resetOnboarding: should set onboarding reducer to initial state',
        initialState: {
            onboarding: {
                path: ['create'],
                activeStepId: STEP.ID_RECOVERY_STEP,
            },
            device: mockSuiteDevice(),
        },
        action: () => onboardingActions.resetOnboarding(),
        expect: {
            toMatchObject: onboardingReducer(undefined, { type: 'foo' } as any),
        },
    },
] as const;
