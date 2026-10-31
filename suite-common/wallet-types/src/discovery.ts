import type { DeviceUniquePath, StaticSessionId, UiEventBundleProgress } from '@trezor/connect';

export type DiscoveryTrigger =
    | 'device-connect'
    | 'device-switch'
    | 'device-check'
    | 'resume'
    | 'coin-toggle'
    | 'account-update'
    | 'add-wallet'
    | 'add-account'
    | 'retry'
    | 'reconnect'
    | 'onboarding';

export type DiscoveryOutcome =
    'complete' | 'failed' | 'cancelled' | 'passphrase-mismatch' | 'passphrase-duplicate';

type CommonDiscoveryStatus = {
    trigger?: DiscoveryTrigger;
    isAddingHiddenWallet?: boolean; // to control visibility of special loader
    isAddingExistingWallet?: boolean; // to control visibility of special loader
    hasLoadedAnyNonEmptyAccount?: boolean; // NOTE: used to indicate the the discovery started loading actual accounts
    passphraseOnDevice?: boolean;
    startTimestamp?: number;
    passphraseSubmitted?: boolean;
    useScopedCallIds?: boolean;
    callId?: string;
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
              total: UiEventBundleProgress<any>['payload']['total'];
              progress: UiEventBundleProgress<any>['payload']['progress'];
          }
        | {
              status: 'confirm-empty-passphrase';
              accountFailed?: boolean;
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
