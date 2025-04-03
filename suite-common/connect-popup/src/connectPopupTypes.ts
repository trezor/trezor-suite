import { TrezorError } from '@trezor/connect/src/constants/errors';
import { MethodPermission } from '@trezor/connect/src/core/AbstractMethod';
import { Deferred } from '@trezor/utils';

export type ConnectPopupCallLoaded = {
    // Common properties that are always present
    method: string;
    methodInfo: {
        methodTitle: string;
        confirmLabel: string;
        permissionTypes: MethodPermission[];
    };
    source: {
        origin?: string;
        processName?: string;
        manifest?: {
            appName?: string;
            appIcon?: string;
        };
    };
} & (
    | {
          state: 'ongoing';
      }
    | {
          state: 'finished';
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
              validated: boolean;
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
    origin: string;
    appName?: string;
    appIcon?: string;
    processName: string;
    types: MethodPermission[];
};
