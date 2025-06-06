import { ErrorCode } from '@trezor/connect/src/constants/errors';
import { MethodPermission } from '@trezor/connect/src/core/AbstractMethod';
import { Deferred } from '@trezor/utils';

export type ManifestPartial = {
    appName: string;
    appIcon?: string;
};

export const CALL_SOURCE_DESKTOP_WS = 'desktop-ws';
export const CALL_SOURCE_WALLETCONNECT = 'walletconnect';
export const CALL_SOURCE_DEEPLINK = 'deeplink';

export type ConnectSerializedError = { error: string; code: ErrorCode };
export type ConnectProcessInfo = {
    name: string;
    fullPath: string;
    icon?: string;
    warning: boolean;
};
export type ConnectCallSource = {
    origin: string;
} & (
    | {
          type: typeof CALL_SOURCE_DESKTOP_WS;
          process: ConnectProcessInfo;
          manifest: ManifestPartial;
      }
    | {
          type: typeof CALL_SOURCE_WALLETCONNECT;
          process?: undefined;
          manifest: ManifestPartial;
      }
    | {
          type: typeof CALL_SOURCE_DEEPLINK;
          process?: undefined;
          manifest: ManifestPartial;
      }
);

export type ConnectPopupCallLoaded = {
    // Common properties that are always present
    method: string;
    methodInfo: {
        methodTitle: string;
        confirmLabel: string;
        permissionTypes: MethodPermission[];
        useUi: boolean;
    };
    source: ConnectCallSource;
    payload: any;
} & (
    | {
          state: 'ongoing';
          permissionDecision?: undefined;
          selectedAccountKey?: string;
      }
    | {
          state: 'finished';
          permissionDecision?: undefined;
      }
    | {
          state: 'permission-request';
          permissionDecision: Deferred<void>;
      }
    | {
          state: 'deeplink-callback';
          callbackUrl: string;
      }
    | {
          state: 'address-confirmation';
          addresses: {
              address: string;
              loading: boolean;
              validated: 'valid' | 'failed' | 'not-started';
              validatePayload: any;
          }[];
      }
    | {
          state: 'call-error';
          error: ConnectSerializedError;
      }
);

export type ConnectPopupCallError = {
    state: 'error';
    error: ConnectSerializedError;
};
export type ConnectPopupCall = ConnectPopupCallLoaded | ConnectPopupCallError;

export type AppRememberedPermission = {
    types: MethodPermission[];
} & ConnectCallSource;
