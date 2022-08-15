import { NetworkSymbol } from '@suite-common/wallet-config';
import { DEVICE } from '@trezor/connect';
import { TrezorDevice } from '@suite-common/suite-types';

export interface NotificationOptions {
    seen?: boolean;
    resolved?: boolean;
    autoClose?: number | false;
}

export type NotificationEventPayload = (
    | {
          // only temporary, must be same as AUTH_DEVICE value in packages/suite/src/actions/suite/constants/suiteConstants.ts
          // once that will be migrated to @suite-common, this should be replaced directly by suiteActions.authDevice.type
          // this should not break type safety, if someone will change value of AUTH_DEVICE, it will throw error in place
          // where action is used and you will need to change it also here
          type: '@suite/auth-device';
      }
    | {
          type: 'tx-received' | 'tx-confirmed';
          formattedAmount: string;
          device?: TrezorDevice;
          descriptor: string;
          symbol: NetworkSymbol;
          txid: string;
      }
    | {
          type: typeof DEVICE.CONNECT | typeof DEVICE.CONNECT_UNACQUIRED;
          device: TrezorDevice;
          needAttention?: boolean;
      }
) &
    NotificationOptions;
