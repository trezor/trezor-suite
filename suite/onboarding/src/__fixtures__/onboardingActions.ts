import { mockSuiteDevice } from '@suite-common/suite-types/mocks';

import {
    addOnboardingPath,
    onboardingReducer,
    removeOnboardingPath,
    resetOnboarding,
} from '../onboardingReducer';
import * as STEP from '../onboardingSteps';
import { goToNextStep, goToPreviousStep } from '../onboardingThunks';

export default [
    {
        description: 'goToNextStep (without param)',
        initialState: {
            device: mockSuiteDevice(),
        },
        action: () => goToNextStep(),
        expect: {
            toMatchObject: { activeStepId: STEP.ID_AUTHENTICATE_DEVICE_STEP },
        },
    },
    {
        description: 'goToNextStep (with param)',
        initialState: {
            device: mockSuiteDevice(),
        },
        action: () => goToNextStep('firmware'),
        expect: {
            toMatchObject: { activeStepId: STEP.ID_FIRMWARE_STEP },
        },
    },
    {
        description: 'goToNextStep: from backup step skip set-pin when pin is already set',
        initialState: {
            onboarding: {
                activeStepId: STEP.ID_BACKUP_STEP,
            },
            device: {
                selectedDevice: mockSuiteDevice(undefined, {
                    pin_protection: true,
                }),
            },
        },
        action: () => goToNextStep(),
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
        action: () => goToPreviousStep(),
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
        action: () => addOnboardingPath('create'),
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
        action: () => addOnboardingPath('create'),
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
        action: () => removeOnboardingPath(['create']),
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
        action: () => removeOnboardingPath(['recovery']),
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
        action: () => resetOnboarding(),
        expect: {
            toMatchObject: onboardingReducer(undefined, { type: 'foo' } as any),
        },
    },
] as const;
