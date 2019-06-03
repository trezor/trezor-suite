import {
    init,
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

export interface Device {
    connected?: boolean;
    // todo: typescript extend with connect
    [key: string]: any;
}

export interface UiInteraction {
    name: null | string;
    counter: number;
}

export type PrevDeviceId = string | null;

export interface ConnectReducer {
    prevDeviceId: PrevDeviceId;
    deviceCall: {
        name: null | string; // todo: better
        isProgress: boolean;
        error: null | string;
        result: null | Record<string, any>;
    };
    deviceInteraction: {
        name: null | string;
        counter: number;
    };
    uiInteraction: UiInteraction;
}

export interface ConnectActions {
    init: typeof init;
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
          type: typeof TRANSPORT_START;
          transport: Record<string, any>; // todo: better
      }
    | {
          type: typeof TRANSPORT_ERROR;
          transport: Record<string, any>;
      }
    | {
          type: typeof DEVICE_CONNECT;
          device: Device;
      }
    | {
          type: typeof CONNECT_UNACQUIRED;
          device: Device;
      }
    | {
          type: typeof CHANGED;
          device: Device;
      }
    | {
          type: typeof DISCONNECT;
          device: Device;
      }
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
      }
    | {
          type: typeof SET_DEVICE_FEATURES;
          features: Record<string, any>; // todo: better
      }
    | {
          type: typeof SET_CONNECT_ERROR;
          error: any; // todo
      };

// export type ActionTypes = TransportStartAction | TransportErrorAction | DeviceConnectAction | DeviceChangedAction | DeviceDisconnectAction | DeviceCallResetAction | DeviceCallStartAction | DeviceCallSuccessAction | DeviceCallErrorAction | DeviceInteractionEventAction | UIInteractionEventAction | SetDeviceFeaturesAction | SetConnectErrorAction;
