import { CallMethodKeys } from '@trezor/connect';
import { ErrorCode } from '@trezor/connect/src/constants/errors';
import { MethodPermission } from '@trezor/connect/src/core/AbstractMethod';

export type ManifestPartial = {
    appName: string;
    appIcon?: string;
    appUrl?: string;
    email?: string;
    npmVersion?: string;
};

export const CALL_SOURCE_DESKTOP_WS = 'desktop-ws';
export const CALL_SOURCE_WEB = 'web';
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
          type: typeof CALL_SOURCE_WEB;
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
    method: CallMethodKeys;
    methodInfo: {
        methodTitle: string;
        confirmLabel?: string;
        permissionTypes: MethodPermission[];
        useUi: boolean;
    };
    source: ConnectCallSource;
    payload: any;
    selectedFee?:
        | {
              gasPrice: undefined;
              maxFeePerGas: string;
              maxPriorityFeePerGas: string;
              gasLimit: string;
          }
        | {
              gasPrice: string;
              maxFeePerGas: undefined;
              maxPriorityFeePerGas: undefined;
              gasLimit: string;
          };
} & (
    | {
          state: 'ongoing';
          selectedAccountKey?: string;
      }
    | {
          state: 'finished';
      }
    | {
          state: 'permission-request';
      }
    | {
          state: 'deeplink-callback';
          callbackUrl: string;
      }
    | {
          state: 'address-confirmation';
          exported: boolean;
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
    | {
          state: 'tx-simulation';
          selectedAccountKey?: string;
          fromAddress: string;
      }
    | {
          state: 'switch-device';
          timestamp: number;
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
