import { produce } from 'immer';
import { type Action as ReduxAction } from 'redux';

import { type OnboardingAnalytics } from '@suite/analytics';
import { type BackupType } from '@suite-common/suite-types';
import { DEVICE, type DeviceEvent } from '@trezor/connect';
import { isArrayMember } from '@trezor/utils';

import { ONBOARDING } from 'src/actions/onboarding/constants';
import { type OnboardingAction } from 'src/actions/onboarding/onboardingActions';
import * as STEP from 'src/constants/onboarding/steps';
import type { AnyPath, AnyStepId } from 'src/types/onboarding';

type DeviceDisconnectAction = DeviceEvent & { type: typeof DEVICE.DISCONNECT };
type OnboardingReducerAction = OnboardingAction | DeviceDisconnectAction;

const ONBOARDING_REDUCER_ACTION_TYPES = [
    ...Object.values(ONBOARDING),
    DEVICE.DISCONNECT,
] as const satisfies OnboardingReducerAction['type'][];

const isOnboardingReducerAction = (action: ReduxAction): action is OnboardingReducerAction =>
    isArrayMember(action.type, ONBOARDING_REDUCER_ACTION_TYPES);

export interface OnboardingRootState {
    onboarding: OnboardingState;
}

export type BackupMedium = 'nfc' | 'wordlist';

export interface OnboardingState {
    backupType: BackupType;
    backupMedium: BackupMedium | null;
    isActive: boolean;
    prevDeviceId: string | null;
    activeStepId: AnyStepId;
    path: AnyPath[];
    onboardingAnalytics: Partial<OnboardingAnalytics>;
}

const initialState: OnboardingState = {
    isActive: false,
    // todo: prevDevice is now used to solve two different things and it cant work
    // would be better to implement field "isMatchingPrevDevice" along with prevDevice
    // prevDevice is used only in firmwareUpdate so maybe move it to firmwareUpdate
    // and here leave only isMatchingPrevDevice ?

    prevDeviceId: null,
    activeStepId: STEP.ID_FIRMWARE_STEP,
    path: [],
    onboardingAnalytics: {},
    backupType: 'shamir-single',
    backupMedium: null,
};

const addPath = (path: AnyPath, state: OnboardingState) => {
    if (!state.path.includes(path)) {
        return [...state.path, path];
    }

    return [...state.path];
};

const removePath = (paths: AnyPath[], state: OnboardingState) =>
    state.path.filter(p => !paths.includes(p));

const ALLOWED_ACTION_TYPES = new Set<OnboardingReducerAction['type']>([
    ONBOARDING.RESET_ONBOARDING,
    ONBOARDING.ENABLE_ONBOARDING_REDUCER,
    ONBOARDING.ANALYTICS,
]);

const onboarding = (state: OnboardingState = initialState, action: ReduxAction) => {
    if (!isOnboardingReducerAction(action)) {
        return state;
    }

    if (!state.isActive && !ALLOWED_ACTION_TYPES.has(action.type)) {
        return state;
    }

    const onboardingAction: OnboardingReducerAction = action;

    return produce(state, draft => {
        switch (onboardingAction.type) {
            case ONBOARDING.ENABLE_ONBOARDING_REDUCER:
                draft.isActive = onboardingAction.payload;
                break;
            case ONBOARDING.SET_STEP_ACTIVE:
                draft.activeStepId = onboardingAction.stepId;
                break;
            case ONBOARDING.ADD_PATH:
                draft.path = addPath(onboardingAction.payload, state);
                break;
            case ONBOARDING.REMOVE_PATH:
                draft.path = removePath(onboardingAction.payload, state);
                break;
            case DEVICE.DISCONNECT:
                draft.prevDeviceId = onboardingAction.payload.id ?? null;
                break;
            case ONBOARDING.ANALYTICS:
                draft.onboardingAnalytics = {
                    ...state.onboardingAnalytics,
                    ...onboardingAction.payload,
                };
                break;
            case ONBOARDING.SELECT_BACKUP_TYPE:
                draft.backupType = onboardingAction.payload;
                break;
            case ONBOARDING.SELECT_BACKUP_MEDIUM:
                draft.backupMedium = onboardingAction.payload;
                break;

            case ONBOARDING.RESET_ONBOARDING:
                return initialState;
            //  no default
        }
    });
};

export const selectIsOnboardingActive = (state: OnboardingRootState) => state.onboarding.isActive;

export const selectOnboardingAnalytics = (state: OnboardingRootState) =>
    state.onboarding.onboardingAnalytics;

export default onboarding;
