import {
    // calls to connect
    resetCall,
    getFeatures,
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
} from '@onboarding-actions/connectActions';

export interface ConnectActions {
    // calls to connect
    resetCall: typeof resetCall;
    getFeatures: typeof getFeatures;
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

export type ConnectActionTypes =
    | {
          type: typeof DEVICE_CALL_RESET;
      }
    | {
          type: typeof DEVICE_CALL_START;
          name: string;
      }
    | {
          type: typeof DEVICE_CALL_RESET;
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
          type: typeof UI_INTERACTION_EVENT;
          name: string;
      };
