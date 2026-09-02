// reexport
export type { CustomBackend } from './backend';
export type { TickerId } from 'src/types/wallet/fiatRates';
export type { Discovery } from '@suite-common/wallet-types';

export type DiscoveryStatusType =
    | {
          status: 'loading';
          type: 'waiting-for-device' | 'auth' | 'discovery';
      }
    | {
          status: 'exception';
          type: 'discovery-empty' | 'discovery-failed' | 'device-unavailable';
      };
export type {
    Account,
    WalletAccountTransaction,
    RbfTransactionParams,
    ReceiveInfo,
} from '@suite-common/wallet-types';

export type { WalletParams } from '@suite/router';
export type AccountItemType = 'coin' | 'tokens' | 'staking';
