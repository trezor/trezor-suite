import produce from 'immer';
import { NOTIFICATION, SUITE } from '@suite-actions/constants';
import { Action as SuiteAction, TrezorDevice } from '@suite-types';
import { WalletParams } from '@wallet-types';

export type ToastPayload =
    | {
          type: 'acquire-error';
          error: string;
          device?: TrezorDevice;
          // acquiringDevice?: TrezorDevice;
      }
    | {
          type: 'auth-confirm-error';
          error?: string;
      }
    | {
          type:
              | 'settings-applied'
              | 'pin-changed'
              | 'device-wiped'
              | 'backup-success'
              | 'verify-message-success';
      }
    | {
          type: 'backup-failed';
      }
    | {
          type: 'tx-confirmed';
          amount: string;
          device?: TrezorDevice;
          routeParams?: WalletParams;
      }
    | {
          type: 'sign-tx-success';
          txid: string;
      }
    | {
          type: 'copy-to-clipboard';
      }
    | {
          type:
              | 'error'
              | 'auth-failed'
              | 'discovery-error'
              | 'verify-address-error'
              | 'sign-message-error'
              | 'verify-message-error'
              | 'sign-tx-error';
          error: string;
      };

interface Common {
    id: number; // programmer provided, might be used to find and close notification programmatically
    device?: TrezorDevice; // used to close notifications for device
    hidden?: boolean;
}

export type EventPayload = {
    type: typeof SUITE.AUTH_DEVICE | 'some-other';
};

export type ToastNotification = { context: 'toast' } & Common & ToastPayload;
export type EventNotification = { context: 'event' } & Common & EventPayload;

export type NotificationEntry = ToastNotification | EventNotification;

export type State = NotificationEntry[];

export default function notification(state: State = [], action: SuiteAction): State {
    return produce(state, draft => {
        switch (action.type) {
            case NOTIFICATION.TOAST:
            case NOTIFICATION.EVENT:
                draft.push(action.payload);
                break;
            case NOTIFICATION.CLOSE: {
                const item = draft.find(n => n.id === action.payload);
                if (item) {
                    item.hidden = true;
                }
                break;
            }
            // no default
        }
    });
}
