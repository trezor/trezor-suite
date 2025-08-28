import { Bip43Path } from '@suite-common/wallet-config';
import type { DeviceUniquePath } from '@trezor/connect';
import { BundleProgress, StaticSessionId } from '@trezor/connect';

import { Account } from './account';

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
    path: Bip43Path;
    unlockPath?: Account['unlockPath'];
    coin: Account['symbol'];
    index: number;
    accountType: Account['accountType'];
    backendType?: Account['backendType'];
};
