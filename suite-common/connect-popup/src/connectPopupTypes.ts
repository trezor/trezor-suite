import { TrezorError } from '@trezor/connect/src/constants/errors';
import { MethodPermission } from '@trezor/connect/src/core/AbstractMethod';
import { Deferred } from '@trezor/utils';

export type ManifestPartial = {
    appName: string;
    appIcon?: string;
};

export const CALL_SOURCE_DESKTOP_WS = 'desktop-ws';
export const CALL_SOURCE_WALLETCONNECT = 'walletconnect';
export const CALL_SOURCE_DEEPLINK = 'deeplink';

export type ConnectCallSource = {
    origin: string;
} & (
    | {
          type: typeof CALL_SOURCE_DESKTOP_WS;
          processName: string;
          manifest: ManifestPartial;
      }
    | {
          type: typeof CALL_SOURCE_WALLETCONNECT;
          processName?: undefined;
          manifest: ManifestPartial;
      }
    | {
          type: typeof CALL_SOURCE_DEEPLINK;
          processName?: undefined;
          manifest?: undefined;
      }
);

export type ConnectPopupCallLoaded = {
    // Common properties that are always present
    method: string;
    methodInfo: {
        methodTitle: string;
        confirmLabel: string;
        permissionTypes: MethodPermission[];
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
          error: TrezorError;
      }
);

export type ConnectPopupCallError = {
    state: 'error';
    error: TrezorError;
};
export type ConnectPopupCall = ConnectPopupCallLoaded | ConnectPopupCallError;

export type AppRememberedPermission = {
    types: MethodPermission[];
} & ConnectCallSource;
