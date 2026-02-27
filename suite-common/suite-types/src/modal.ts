import { RequestEnableTorResponse } from '@suite-common/suite-config';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Account, AddressType } from '@suite-common/wallet-types';
import { UI_REQUEST } from '@trezor/connect';
import { Deferred } from '@trezor/utils';

import { TrezorDevice } from './device';
import { EarnAnalyticsStep, EarnFlow, EarnProvider } from './staking';

export type UserContextPayload =
    | {
          type: 'qr-reader';
          decision: Deferred<string>;
      }
    | {
          type: 'unverified-address';
          value: string;
          addressPath: string;
      }
    | {
          type: 'unverified-xpub';
      }
    | {
          type: 'unverified-address-proceed';
          value: string;
      }
    | {
          type: 'address';
          value: string;
          addressPath: string;
          isConfirmed?: boolean;
      }
    | {
          type: 'xpub';
          isConfirmed?: boolean;
      }
    | {
          type: 'add-account';
          device: TrezorDevice;
          symbol?: Account['symbol'];
          noRedirect?: boolean;
          isCoinjoinDisabled?: boolean;
          isBackClickDisabled?: boolean;
          onCancel?: () => void;
          onConfirm?: () => void;
      }
    | {
          type: 'device-background-gallery';
      }
    | {
          type: 'transaction-detail';
          txid: string;
          descriptor: Account['descriptor'];
          symbol: Account['symbol'];
          deviceState: Account['deviceState'];
          flow: 'detail' | 'bump-fee' | 'cancel-transaction';
      }
    | {
          type: 'review-transaction';
          decision: Deferred<boolean>;
      }
    | {
          type: 'review-transaction-rbf-previous-transaction-mined-error';
          decision?: Deferred<boolean>;
      }
    | {
          type: 'import-transaction';
          decision: Deferred<{ [key: string]: string }[]>;
      }
    | {
          type: 'application-log';
      }
    | {
          type: 'pin-mismatch';
      }
    | {
          type: typeof UI_REQUEST.INVALID_PIN_ATTEMPTS_DEPLETED;
      }
    | {
          type: 'device-authenticity-check-opt-out';
      }
    | {
          type: 'firmware-authenticity-checks-opt-out';
      }
    | {
          type: 'metadata-provider';
          decision: Deferred<boolean>;
      }
    | {
          type: 'advanced-coin-settings';
          symbol: NetworkSymbol;
      }
    | {
          type: 'add-token';
      }
    | {
          type: 'safety-checks';
      }
    | {
          type: 'disable-tor';
          decision: Deferred<boolean>;
      }
    | {
          type: 'request-enable-tor';
          decision: Deferred<RequestEnableTorResponse>;
      }
    | {
          type: 'disable-tor-stop-coinjoin';
          decision: Deferred<boolean>;
      }
    | {
          type: 'tor-loading';
          decision: Deferred<boolean>;
      }
    | {
          type: 'cancel-coinjoin';
      }
    | {
          type: 'critical-coinjoin-phase';
          relatedAccountKey: string;
      }
    | {
          type: 'coinjoin-success';
          relatedAccountKey: string;
      }
    | {
          type: 'more-rounds-needed';
      }
    | {
          type: 'uneco-coinjoin-warning';
      }
    | {
          type: 'earn-in-a-nutshell';
          flow: EarnFlow;
          provider: EarnProvider;
          account: Account;
          analyticsStep: EarnAnalyticsStep;
          yieldId?: string;
          tokenContractAddress?: string;
      }
    | {
          type: 'supply';
          flow: EarnFlow;
          account: Account;
          yieldId?: string;
          tokenContractAddress?: string;
      }
    | {
          type: 'stake';
          flow: EarnFlow;
          account: Account;
          yieldId?: string;
          tokenContractAddress?: string;
      }
    | {
          type: 'withdraw';
          account: Account;
      }
    | {
          type: 'unstake';
          account: Account;
      }
    | {
          type: 'claim';
          account: Account;
      }
    | {
          type: 'earn-provider-consent';
          flow: EarnFlow;
          provider: EarnProvider;
          account: Account;
          yieldId?: string;
          tokenContractAddress?: string;
      }
    | {
          type: 'change-delegate';
      }
    | {
          type: 'copy-address';
          addressType: AddressType;
          address: string;
      }
    | {
          type: 'unhide-token';
          address: string;
      }
    | {
          type: 'connect-popup';
      }
    | {
          type: 'walletconnect-proposal';
          eventId: number;
      }
    | {
          type: 'walletconnect-switch-account';
          sessionTopic: string;
      }
    | {
          type: 'connect-address-confirmation';
      }
    | {
          type: 'connect-error';
      }
    | {
          type: 'connect-loading';
      }
    | {
          type: 'auto-start-before-quit';
      }
    | {
          type: 'tx-simulation';
      }
    | {
          type: 'wipe-device-success';
      };
