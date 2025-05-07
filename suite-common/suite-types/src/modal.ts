import { RequestEnableTorResponse } from '@suite-common/suite-config';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Account, AddressType, WalletAccountTransaction } from '@suite-common/wallet-types';
import { Deferred } from '@trezor/utils';

import { TrezorDevice } from './device';

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
          type: 'passphrase-duplicate';
          device: TrezorDevice;
          duplicate: TrezorDevice;
      }
    | {
          type: 'add-account';
          device: TrezorDevice;
          symbol?: Account['symbol'];
          noRedirect?: boolean;
          isCoinjoinDisabled?: boolean;
          isBackClickDisabled?: boolean;
          onCancel?: () => void;
      }
    | {
          type: 'device-background-gallery';
      }
    | {
          type: 'transaction-detail';
          tx: WalletAccountTransaction;
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
          type: 'trading-buy-terms';
          provider?: string;
          cryptoCurrency?: string;
          decision: Deferred<boolean>;
      }
    | {
          type: 'trading-sell-terms';
          provider?: string;
          cryptoCurrency?: string;
          decision: Deferred<boolean>;
      }
    | {
          type: 'trading-exchange-terms';
          provider?: string;
          fromCryptoCurrency?: string;
          toCryptoCurrency?: string;
          decision: Deferred<boolean>;
      }
    | {
          type: 'trading-exchange-dex-terms';
          provider?: string;
          fromCryptoCurrency?: string;
          toCryptoCurrency?: string;
          decision: Deferred<boolean>;
      }
    | {
          type: 'application-log';
      }
    | {
          type: 'pin-mismatch';
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
          type: 'authenticate-device';
      }
    | {
          type: 'authenticate-device-fail';
      }
    | {
          type: 'stake-in-a-nutshell';
      }
    | {
          type: 'stake';
      }
    | {
          type: 'unstake';
      }
    | {
          type: 'claim';
      }
    | {
          type: 'everstake';
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
          type: 'passphrase-mismatch-warning';
      }
    | {
          type: 'cardano-withdraw-modal';
      }
    | {
          type: 'connect-popup';
      }
    | {
          type: 'walletconnect-proposal';
          eventId: number;
      }
    | {
          type: 'trading-dca';
          device: TrezorDevice;
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
      };
