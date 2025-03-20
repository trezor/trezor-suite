import { TrezorError } from '@trezor/connect/src/constants/errors';
import { MethodPermission } from '@trezor/connect/src/core/AbstractMethod';
import { Deferred } from '@trezor/utils';

export type ConnectPopupCall =
    | {
          state: 'request';
          method: string;
          methodTitle: string;
          confirmLabel: string;
          processName?: string;
          origin?: string;
          permissionTypes: MethodPermission[];
          manifest?: {
              appName?: string;
              appIcon?: string;
          };
          confirmation: Deferred<void>;
      }
    | {
          state: 'call-error';
          callError: TrezorError;
      }
    | {
          state: 'deeplink-callback';
          callbackUrl: string;
      }
    | {
          state: 'finished';
      };

export type AppRememberedPermission = {
    origin: string;
    appName?: string;
    appIcon?: string;
    processName: string;
    types: MethodPermission[];
};
