import { type DeviceReducerState } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';

import * as onboardingActions from 'src/actions/onboarding/onboardingActions';
import * as STEP from 'src/constants/onboarding/steps';
import onboardingReducer, { type OnboardingState } from 'src/reducers/onboarding/onboardingReducer';

type OnboardingAction = ReturnType<
    | typeof onboardingActions.goToNextStepThunk
    | typeof onboardingActions.goToPreviousStepThunk
    | typeof onboardingActions.addPath
    | typeof onboardingActions.removePath
    | typeof onboardingActions.resetOnboarding
>;

export type OnboardingActionsFixture = {
    description: string;
    initialState: {
        onboarding?: Partial<OnboardingState>;
        device?: Partial<DeviceReducerState>;
    };
    action: () => OnboardingAction;
    expect: {
        toMatchObject: {
            activeStepId?: OnboardingState['activeStepId'];
            path?: string[];
        };
    };
};

export const fixtures: OnboardingActionsFixture[] = [
    {
        description: 'goToNextStepThunk (without param)',
        initialState: {
            device: {
                selectedDevice: mockSuiteDevice(undefined, {
                    internal_model: DeviceModelInternal.T3T1,
                }),
            },
        },
        action: () => onboardingActions.goToNextStepThunk(),
        expect: {
            toMatchObject: { activeStepId: STEP.ID_AUTHENTICATE_DEVICE_STEP },
        },
    },
    {
        description: 'goToNextStepThunk (with param)',
        initialState: {
            device: { selectedDevice: mockSuiteDevice() },
        },
        action: () => onboardingActions.goToNextStepThunk('firmware'),
        expect: {
            toMatchObject: { activeStepId: STEP.ID_FIRMWARE_STEP },
        },
    },
    {
        description: 'goToPreviousStepThunk',
        initialState: {
            onboarding: {
                activeStepId: STEP.ID_RECOVERY_STEP,
            },
        },
        action: () => onboardingActions.goToPreviousStepThunk(),
        expect: {
            toMatchObject: { activeStepId: STEP.ID_BACKUP_TYPE_STEP },
        },
    },
    {
        description: 'addPath: should add unique entry',
        initialState: {
            onboarding: {
                path: ['new' as unknown as OnboardingState['path'][number]],
            },
            device: { selectedDevice: mockSuiteDevice() },
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
            device: { selectedDevice: mockSuiteDevice() },
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
            device: { selectedDevice: mockSuiteDevice() },
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
            device: { selectedDevice: mockSuiteDevice() },
        },
        action: () => onboardingActions.resetOnboarding(),
        expect: {
            toMatchObject: onboardingReducer(undefined, { type: 'foo' } as any),
        },
    },
];
