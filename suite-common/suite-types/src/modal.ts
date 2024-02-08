import { Deferred } from '@trezor/utils';
import { Account, AddressType, WalletAccountTransaction } from '@suite-common/wallet-types';
import { RequestEnableTorResponse } from '@suite-common/suite-config';

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
      }
    | {
          type: 'device-background-gallery';
      }
    | {
          type: 'transaction-detail';
          tx: WalletAccountTransaction;
          rbfForm?: boolean;
      }
    | {
          type: 'review-transaction';
          decision: Deferred<boolean>;
      }
    | {
          type: 'import-transaction';
          decision: Deferred<{ [key: string]: string }[]>;
      }
    | {
          type: 'coinmarket-buy-terms';
          provider?: string;
          cryptoCurrency?: string;
          decision: Deferred<boolean>;
      }
    | {
          type: 'coinmarket-sell-terms';
          provider?: string;
          cryptoCurrency?: string;
          decision: Deferred<boolean>;
      }
    | {
          type: 'coinmarket-exchange-terms';
          provider?: string;
          fromCryptoCurrency?: string;
          toCryptoCurrency?: string;
          decision: Deferred<boolean>;
      }
    | {
          type: 'coinmarket-exchange-dex-terms';
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
          type: 'wipe-device';
      }
    | {
          type: 'device-authenticity-opt-out';
      }
    | {
          type: 'firmware-revision-opt-out';
      }
    | {
          type: 'disconnect-device';
      }
    | {
          type: 'metadata-provider';
          decision: Deferred<boolean>;
      }
    | {
          type: 'advanced-coin-settings';
          coin: Account['symbol'];
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
          type: 'stake-eth-in-a-nutshell';
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
          type: 'select-bluetooth-device';
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
      };
