import * as onboardingActions from '@onboarding-actions/onboardingActions';
import onboardingReducer from '@onboarding-reducers/onboardingReducer';
import * as STEP from '@onboarding-constants/steps';

const { getSuiteDevice } = global.JestMocks;

export default [
    {
        description: 'goToNextStep (without param)',
        initialState: {
            suite: {
                device: getSuiteDevice(),
            },
        },
        action: () => onboardingActions.goToNextStep(),
        expect: {
            toMatchObject: { activeStepId: STEP.ID_FIRMWARE_STEP },
        },
    },
    {
        description: 'goToNextStep (with param)',
        initialState: {
            suite: {
                device: getSuiteDevice(),
            },
        },
        action: () => onboardingActions.goToNextStep('firmware'),
        expect: {
            toMatchObject: { activeStepId: STEP.ID_FIRMWARE_STEP },
        },
    },
    {
        description: 'goToSubStep',
        initialState: {
            suite: {
                device: getSuiteDevice(),
            },
        },
        action: () => onboardingActions.goToSubStep('moo'),
        expect: {
            toMatchObject: { activeSubStep: 'moo' },
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
            suite: {
                device: getSuiteDevice(),
            },
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
            suite: {
                device: getSuiteDevice(),
            },
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
            suite: {
                device: getSuiteDevice(),
            },
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
            suite: {
                device: getSuiteDevice(),
            },
        },
        action: () => onboardingActions.resetOnboarding(),
        expect: {
            toMatchObject: onboardingReducer(undefined, { type: 'foo' } as any),
        },
    },
] as const;
