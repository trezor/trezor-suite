import { TrezorError } from '@trezor/connect/src/constants/errors';
import { Deferred } from '@trezor/utils';

export type ConnectPopupCall =
    | {
          state: 'request';
          method: string;
          methodTitle: string;
          confirmLabel: string;
          processName?: string;
          origin?: string;
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
