/* eslint-disable @typescript-eslint/camelcase */
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as connectActions from '@onboarding-actions/connectActions';
import onboardingReducer from '@onboarding-reducers/onboardingReducer';
import * as STEP from '@onboarding-constants/steps';

const { getSuiteDevice, getDeviceFeatures } = global.JestMocks;
const connectSuccessResponse = { success: true };

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
            toMatchObject: { activeStepId: STEP.ID_CREATE_OR_RECOVER },
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
                activeStepId: STEP.ID_NEW_OR_USED,
            },
        },
        action: () => onboardingActions.goToPreviousStep(),
        expect: {
            toMatchObject: { activeStepId: STEP.ID_CREATE_OR_RECOVER },
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
                path: ['new'],
            },
            suite: {
                device: getSuiteDevice(),
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
            suite: {
                device: getSuiteDevice(),
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
            suite: {
                device: getSuiteDevice(),
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
            suite: {
                device: getSuiteDevice(),
            },
        },
        action: () => onboardingActions.resetOnboarding(),
        expect: {
            toMatchObject: onboardingReducer(undefined, { type: 'foo' } as any),
        },
    },
    {
        description: 'setBackupType',
        initialState: {
            onboarding: {
                backupType: 0,
            },
            suite: {
                device: getSuiteDevice(),
            },
        },
        action: () => onboardingActions.setBackupType(1),
        expect: {
            toMatchObject: { backupType: 1 },
        },
    },
] as const;

export const deviceCallsGeneral = [
    {
        description: 'deviceCall: test error and isProgress',
        initialState: {
            suite: {
                device: getSuiteDevice(),
            },
        },
        mocks: {
            connectResponse: {
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
        initialState: {
            suite: {
                device: getSuiteDevice(),
            },
        },
        mocks: {
            connectResponse: connectSuccessResponse,
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
    {
        description: 'deviceCall: no device in reducer',
        initialState: {},
        mocks: {},
        action: () => connectActions.applySettings({ label: 'foo' }),
        expect: {
            // actually no waiting for promise here and call is resolved right away so both assertions are same.
            stateBeforeResolve: {
                deviceCall: {
                    name: 'applySettings',
                    error: 'no device connected',
                    isProgress: false,
                },
            },
            stateAfterResolve: {
                deviceCall: {
                    name: 'applySettings',
                    error: 'no device connected',
                    isProgress: false,
                },
            },
        },
    },
];

// this part of test is here more or less to get higher coverage. currently no assertions are
// done as they are in general part. Id say adding assertions here brings little benefit and reduces maintainability.
export const deviceCallsSpecific = [
    {
        description: 'resetDevice - t2',
        initialState: {
            suite: {
                device: getSuiteDevice({
                    features: getDeviceFeatures({ major_version: 2 }),
                }),
            },
        },
        mocks: {
            connectResponse: connectSuccessResponse,
        },
        action: () => connectActions.resetDevice(),
    },
    {
        description: 'resetDevice - t1',
        initialState: {
            suite: {
                device: getSuiteDevice({
                    features: getDeviceFeatures({ major_version: 1 }),
                }),
            },
        },
        mocks: {
            connectResponse: connectSuccessResponse,
        },
        action: () => connectActions.resetDevice(),
    },
    {
        description: 'backupDevice',
        initialState: {
            suite: {
                device: getSuiteDevice({
                    features: getDeviceFeatures({ major_version: 2 }),
                }),
            },
        },
        mocks: {
            connectResponse: connectSuccessResponse,
        },
        action: () => connectActions.backupDevice(),
    },
    {
        description: 'applySettings',
        initialState: {
            suite: {
                device: getSuiteDevice({
                    features: getDeviceFeatures({ major_version: 2 }),
                }),
            },
        },
        mocks: {
            connectResponse: connectSuccessResponse,
        },
        action: () => connectActions.applySettings({ label: 'foo' }),
    },
    {
        description: 'applyFlags',
        initialState: {
            suite: {
                device: getSuiteDevice({
                    features: getDeviceFeatures({ major_version: 2 }),
                }),
            },
        },
        mocks: {
            connectResponse: connectSuccessResponse,
        },
        action: () => connectActions.applyFlags({ flags: 1 }),
    },
    {
        description: 'changePin',
        initialState: {
            suite: {
                device: getSuiteDevice({
                    features: getDeviceFeatures({ major_version: 2 }),
                }),
            },
        },
        mocks: {
            connectResponse: connectSuccessResponse,
        },
        action: () => connectActions.changePin(),
    },
    {
        description: 'wipeDevice',
        initialState: {
            suite: {
                device: getSuiteDevice({
                    features: getDeviceFeatures({ major_version: 2 }),
                }),
            },
        },
        mocks: {
            connectResponse: connectSuccessResponse,
        },
        action: () => connectActions.wipeDevice(),
    },
    {
        description: 'getFeatures',
        initialState: {
            suite: {
                device: getSuiteDevice({
                    features: getDeviceFeatures({ major_version: 2 }),
                }),
            },
        },
        mocks: {
            connectResponse: connectSuccessResponse,
        },
        action: () => connectActions.getFeatures(),
    },
];
