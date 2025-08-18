import { Bip43Path } from '@suite-common/wallet-config';
import type { DeviceUniquePath } from '@trezor/connect';
import { BundleProgress, StaticSessionId } from '@trezor/connect';

import { Account, AccountBackendSpecific } from './account';

type CommonDiscoveryStatus = {
    isAddingHiddenWallet?: boolean; // to control visibility of special loader
    isAddingExistingWallet?: boolean; // to control visibility of special loader
    isAddingHiddenWalletWithRespectToSettings?: boolean;
    hasLoadedAnyNonEmptyAccount?: boolean; // NOTE: used to indicate the the discovery started loading actual accounts
    emptyWallet?: boolean;
    passphraseOnDevice?: boolean;
    startTimestamp?: number;
    passphraseSubmitted?: boolean;
};

export type DiscoveryStatus = CommonDiscoveryStatus &
    (
        | {
              status: 'starting';
          }
        | {
              status: 'enter-passphrase';
          }
        | {
              status: 'passphrase-enable-on-device';
          }
        | {
              status: 'passphrase-duplicate';
              duplicateDeviceStaticSessionId: StaticSessionId;
          }
        | {
              status: 'passphrase-mismatch';
          }
        | {
              status: 'cancelled';
          }
        | {
              status: 'progress';
              total: BundleProgress<any>['payload']['total'];
              progress: BundleProgress<any>['payload']['progress'];
          }
        | {
              status: 'confirm-empty-passphrase';
              //   accountsToBeCreated: Account[];
          }
        | {
              status: 'complete';
          }
        | {
              status: 'failed';
              error?: string;
              errorCode?: 'Method_InvalidParameter' | (string & {});
          }
    );

export type Discovery = Record<DeviceUniquePath, DiscoveryStatus>;

export type DiscoveryItem = {
    // @trezor/connect
    path: Bip43Path;
    unlockPath?: Account['unlockPath'];
    coin: Account['symbol'];
    identity?: string;
    details?: 'basic' | 'tokens' | 'tokenBalances' | 'txids' | 'txs';
    pageSize?: number;
    suppressBackupWarning?: boolean;
    // Useful to skip additional getFeatures call which is redundant in discovery
    skipFinalReload?: boolean;
    // wallet
    index: number;
    accountType: Account['accountType'];
    derivationType?: 0 | 1 | 2;
} & AccountBackendSpecific;
