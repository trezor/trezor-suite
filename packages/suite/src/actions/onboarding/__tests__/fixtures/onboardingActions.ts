import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as connectActions from '@onboarding-actions/connectActions';
import onboardingReducer from '@onboarding-reducers/onboardingReducer';
import * as STEP from '@onboarding-constants/steps';

export default [
    {
        description: 'goToNextStep (without param)',
        initialState: {},
        action: () => onboardingActions.goToNextStep(),
        expect: {
            toMatchObject: { activeStepId: STEP.ID_NEW_OR_USED },
        },
    },
    {
        description: 'goToNextStep (with param)',
        initialState: {},
        action: () => onboardingActions.goToNextStep('firmware'),
        expect: {
            toMatchObject: { activeStepId: STEP.ID_FIRMWARE_STEP },
        },
    },
    {
        description: 'goToSubStep',
        initialState: {},
        action: () => onboardingActions.goToSubStep('moo'),
        expect: {
            toMatchObject: { activeSubStep: 'moo' },
        },
    },
    {
        description: 'goToPreviousStep',
        initialState: {
            onboarding: {
                activeStepId: STEP.ID_NEW_OR_USED,
            },
        },
        action: () => onboardingActions.goToPreviousStep(),
        expect: {
            toMatchObject: { activeStepId: STEP.ID_WELCOME_STEP },
        },
    },
    {
        description: 'addPath: should add unique entry',
        initialState: {
            onboarding: {
                path: ['new'],
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
                path: ['new'],
            },
        },
        action: () => onboardingActions.addPath('new'),
        expect: {
            toMatchObject: { path: ['new'] },
        },
    },
    {
        description: 'removePath: one element',
        initialState: {
            onboarding: {
                path: ['create', 'new'],
            },
        },
        action: () => onboardingActions.removePath(['create']),
        expect: {
            toMatchObject: { path: ['new'] },
        },
    },
    {
        description: 'removePath: multiple elements',
        initialState: {
            onboarding: {
                path: ['create', 'new'],
            },
        },
        action: () => onboardingActions.removePath(['create', 'new']),
        expect: {
            toMatchObject: { path: [] },
        },
    },
    {
        description: 'selectTrezorModel',
        initialState: {
            onboarding: {
                selectModel: 1,
            },
        },
        action: () => onboardingActions.selectTrezorModel(2),
        expect: {
            toMatchObject: { selectedModel: 2 },
        },
    },
    {
        description: 'resetOnboarding: should set onboarding reducer to initial state',
        initialState: {
            onboarding: {
                path: ['create', 'new', 'used'],
                activeStepId: STEP.ID_RECOVERY_STEP,
            },
        },
        action: () => onboardingActions.resetOnboarding(),
        expect: {
            toMatchObject: onboardingReducer(undefined, { type: 'foo' } as any),
        },
    },
] as const;

export const deviceCalls = [
    {
        description: 'deviceCall: test error and isProgress',
        initialState: {},
        mocks: {
            applySettings: {
                success: false,
                payload: {
                    error: 'error',
                },
            },
        },
        action: () => connectActions.applySettings({ label: 'foo' }),
        expect: {
            stateBeforeResolve: {
                deviceCall: {
                    name: 'applySettings',
                    error: null,
                    isProgress: true,
                },
            },
            stateAfterResolve: {
                deviceCall: {
                    name: 'applySettings',
                    error: 'error',
                    isProgress: false,
                },
            },
        },
    },
    {
        description: 'deviceCall: test success and isProgress',
        initialState: {},
        mocks: {
            applySettings: {
                success: true,
            },
        },
        action: () => connectActions.applySettings({ label: 'foo' }),
        expect: {
            stateBeforeResolve: {
                deviceCall: {
                    name: 'applySettings',
                    error: null,
                    isProgress: true,
                },
            },
            stateAfterResolve: {
                deviceCall: {
                    name: 'applySettings',
                    error: null,
                    isProgress: false,
                },
            },
        },
    },
];
