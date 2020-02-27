import produce from 'immer';
import { NOTIFICATION, SUITE } from '@suite-actions/constants';
import { Action, TrezorDevice } from '@suite-types';

interface Options {
    seen?: boolean;
    resolved?: boolean;
}

export type ToastPayload = (
    | {
          type: 'acquire-error';
          error: string;
          device?: TrezorDevice;
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
              | 'backup-failed'
              | 'verify-message-success';
      }
    | {
          type: 'tx-sent';
          amount: string;
          device?: TrezorDevice;
          descriptor: string;
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
      }
) &
    Options;

interface Common {
    id: number; // programmer provided, might be used to find and close notification programmatically
    device?: TrezorDevice; // used to close notifications for device
    closed?: boolean;
}

export type EventPayload = (
    | {
          type: typeof SUITE.AUTH_DEVICE;
      }
    | {
          type: 'tx-received' | 'tx-confirmed';
          amount: string;
          device?: TrezorDevice;
          descriptor: string;
          txid: string;
      }
) &
    Options;

export type ToastNotification = { context: 'toast' } & Common & ToastPayload;
export type EventNotification = { context: 'event' } & Common & EventPayload;

export type NotificationEntry = ToastNotification | EventNotification;

export type State = NotificationEntry[];

export default function notification(state: State = [], action: Action): State {
    return produce(state, draft => {
        switch (action.type) {
            case NOTIFICATION.TOAST:
            case NOTIFICATION.EVENT:
                draft.unshift(action.payload);
                break;
            case NOTIFICATION.CLOSE: {
                const item = draft.find(n => n.id === action.payload);
                if (item) {
                    item.closed = true;
                }
                break;
            }
            case NOTIFICATION.RESET_UNSEEN: {
                draft.forEach(n => {
                    if (!n.seen) n.seen = true;
                });
                break;
            }
            case NOTIFICATION.REMOVE: {
                draft = draft.filter(n => n.id !== action.payload);
                break;
            }
            // no default
        }
    });
}
