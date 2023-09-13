import { TokenInfo } from '@trezor/connect';

export type ReviewOutput =
    | {
          type: 'regular_legacy';
          label: string;
          value: string;
          value2?: undefined;
          token?: TokenInfo;
      }
    | {
          type:
              | 'opreturn'
              | 'data'
              | 'locktime'
              | 'fee'
              | 'destination-tag'
              | 'txid'
              | 'address'
              | 'amount'
              | 'gas'
              | 'contract';
          label?: string;
          value: string;
          value2?: string;
          token?: TokenInfo;
      }
    | {
          type: 'fee-replace';
          label?: undefined;
          value: string;
          value2: string;
          token?: undefined;
      }
    | {
          type: 'reduce-output';
          label: string;
          value: string;
          value2: string;
          token?: undefined;
      };

export type {
    SignTransactionData,
    ComposeTransactionData,
    SignedTx,
    ReviewTransactionData,
} from '@suite-common/wallet-types';
