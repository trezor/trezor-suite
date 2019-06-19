import {
    // calls to connect
    resetCall,
    getFeatures,
    firmwareErase,
    firmwareUpload,
    resetDevice,
    backupDevice,
    applySettings,
    applyFlags,
    changePin,
    recoveryDevice,
    wipeDevice,
    // customizable call
    callActionAndGoToNextStep,
    // responses to device events
    submitNewPin,
    submitWord,
} from '@suite/actions/onboarding/connectActions';

export interface UiInteraction {
    name: null | string;
    counter: number;
}

export type PrevDeviceId = string | null;

export interface ConnectReducer {
    prevDeviceId: PrevDeviceId;
    device: any; // todo: remove any
    deviceCall: {
        name: null | string; // todo: better, make type AnyDeviceCall
        isProgress: boolean;
        error: null | string;
        result: null | Record<string, any>;
    };
    deviceInteraction: {
        name: null | string; // todo: better
        counter: number;
    };
    uiInteraction: UiInteraction;
}

export interface ConnectActions {
    // calls to connect
    resetCall: typeof resetCall;
    getFeatures: typeof getFeatures;
    firmwareErase: typeof firmwareErase;
    firmwareUpload: typeof firmwareUpload;
    resetDevice: typeof resetDevice;
    backupDevice: typeof backupDevice;
    applySettings: typeof applySettings;
    applyFlags: typeof applyFlags;
    changePin: typeof changePin;
    recoveryDevice: typeof recoveryDevice;
    wipeDevice: typeof wipeDevice;
    // customizable call
    callActionAndGoToNextStep: typeof callActionAndGoToNextStep;
    // responses to device events
    submitNewPin: typeof submitNewPin;
    submitWord: typeof submitWord;
}

export const DEVICE_CALL_RESET = '@onboarding/connect-device-call-reset';
export const DEVICE_CALL_START = '@onboarding/connect-device-call-start';
export const DEVICE_CALL_SUCCESS = '@onboarding/connect-device-call-success';
export const DEVICE_CALL_ERROR = '@onboarding/connect-device-call-error';
export const DEVICE_INTERACTION_EVENT = '@onboarding/connect-device-interaction-event';
export const UI_INTERACTION_EVENT = '@onboarding/connect-ui-interaction-event';

// todo: these are temporary connect types
export const DEVICE_CONNECT = 'device-connect';
export const CONNECT_UNACQUIRED = 'device-connect_unacquired';
export const DISCONNECT = 'device-disconnect';
export const CHANGED = 'device-changed';
export const ACQUIRE = 'device-acquire';
export const RELEASE = 'device-release';
export const ACQUIRED = 'device-acquired';
export const RELEASED = 'device-released';
export const USED_ELSEWHERE = 'device-used_elsewhere';

export type ActionTypes =
    | {
          type: typeof DEVICE_CALL_RESET;
      }
    | {
          type: typeof DEVICE_CALL_START;
          name: string;
      }
    | {
          type: typeof DEVICE_CALL_SUCCESS;
          result: Record<string, any>;
      }
    | {
          type: typeof DEVICE_CALL_ERROR;
          name: string; // todo: why use name here and not in success?
          error: string;
      }
    | {
          type: typeof DEVICE_INTERACTION_EVENT;
          name: string;
      }
    | {
          type: typeof UI_INTERACTION_EVENT;
          name: string;
      };
