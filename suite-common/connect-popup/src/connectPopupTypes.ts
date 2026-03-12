import { AccountKey, TxSimulationAction } from '@suite-common/wallet-types';
import { CallMethodKeys } from '@trezor/connect';
import { MethodPermission } from '@trezor/connect/src/core/AbstractMethod';
import { SerializedError } from '@trezor/connect-common/src/constants/errors';

export type ManifestPartial = {
    appName: string;
    appIcon?: string;
    appUrl?: string;
    email?: string;
    npmVersion?: string;
};

export const CALL_SOURCE_DESKTOP_WS = 'desktop-ws';
export const CALL_SOURCE_MCP = 'mcp';
export const CALL_SOURCE_WEB = 'web';
export const CALL_SOURCE_WALLETCONNECT = 'walletconnect';
export const CALL_SOURCE_DEEPLINK = 'deeplink';

export type ConnectSerializedError = SerializedError;
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
          type: typeof CALL_SOURCE_MCP;
          process?: ConnectProcessInfo;
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

type SelectedFee =
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

type TxSimulationConnectPopupCallLoaded = {
    state: 'tx-simulation';
    selectedAccountKey?: AccountKey;
} & Omit<TxSimulationAction, 'sourceOrigin'>;

export type ConnectPopupCallLoaded = {
    // Common properties that are always present
    methodInfo: {
        methodTitle: string;
        confirmLabel?: string;
        permissionTypes: MethodPermission[];
        useUi: boolean;
    };
    source: ConnectCallSource;
    selectedFee?: SelectedFee;
} & (
    | {
          method: CallMethodKeys;
          state: 'ongoing';
          selectedAccountKey?: AccountKey;
          payload: any;
      }
    | {
          method: CallMethodKeys;
          state: 'finished';
          payload: any;
      }
    | {
          method: CallMethodKeys;
          state: 'permission-request';
          payload: any;
      }
    | {
          method: CallMethodKeys;
          state: 'deeplink-callback';
          callbackUrl: string;
          payload: any;
      }
    | {
          method: CallMethodKeys;
          state: 'address-confirmation';
          exported: boolean;
          addresses: {
              address: string;
              loading: boolean;
              validated: 'valid' | 'failed' | 'not-started';
              validatePayload: any;
          }[];
          payload: any;
      }
    | {
          method: CallMethodKeys;
          state: 'call-error';
          error: ConnectSerializedError;
          payload: any;
      }
    | TxSimulationConnectPopupCallLoaded
    | {
          method: CallMethodKeys;
          state: 'switch-device';
          timestamp: number;
          payload: any;
      }
);

export type ConnectPopupCallError = {
    state: 'error';
    error: ConnectSerializedError;
};
export type ConnectPopupCall = ConnectPopupCallLoaded | ConnectPopupCallError;

export type ConnectPopupCallWithState<
    CallState extends ConnectPopupCall['state'],
    Method extends ConnectPopupCallLoaded['method'] = ConnectPopupCallLoaded['method'],
> = Extract<ConnectPopupCallLoaded, { state: CallState; method: Method }>;

export type AppRememberedPermission = {
    types: MethodPermission[];
} & ConnectCallSource;
