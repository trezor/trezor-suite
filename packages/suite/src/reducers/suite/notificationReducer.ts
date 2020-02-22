import produce from 'immer';
import { NOTIFICATION } from '@suite-actions/constants';
import { Action as SuiteAction, TrezorDevice } from '@suite-types';
import { WalletParams } from '@wallet-types';

export type NotificationPayload =
    | {
          type: 'acquire-error';
          error: string;
          acquiringDevice?: TrezorDevice;
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
          accountDevice?: TrezorDevice;
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

export type NotificationEntry = {
    id: number; // programmer provided, might be used to find and close notification programmatically
    device?: TrezorDevice; // used to close notifications for device
    hidden?: boolean;
} & NotificationPayload;

export type State = NotificationEntry[];

export default function notification(state: State = [], action: SuiteAction): State {
    return produce(state, draft => {
        switch (action.type) {
            case NOTIFICATION.ADD:
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
