import type { TokenInfo } from '@trezor/connect';

import { type FormStateTradingCryptoCurrency, type FormStateTradingFiatCurrency } from './sendForm';

export type ReviewOutput =
    | {
          type:
              | 'opreturn'
              | 'data'
              | 'locktime'
              | 'fee'
              | 'destination-tag'
              | 'signing-with'
              | 'network'
              | 'timebounds'
              | 'txid'
              | 'address'
              | 'amount'
              | 'gas'
              | 'contract'
              | 'regular_legacy'
              | 'approve_data'
              | 'recipient_name';
          label?: string;
          value: string;
          value2?: string;
          token?: TokenInfo;
          send?: undefined;
          receive?: undefined;
      }
    | {
          type: 'fee-replace';
          label?: undefined;
          value: string;
          value2: string;
          token?: undefined;
          send?: undefined;
          receive?: undefined;
      }
    | {
          type: 'reduce-output';
          label: string;
          value: string;
          value2: string;
          token?: undefined;
          send?: undefined;
          receive?: undefined;
      }
    | {
          type: 'traded_assets';
          value: string;
          value2: string;
          label?: undefined;
          token?: undefined;
          send: FormStateTradingCryptoCurrency;
          receive: FormStateTradingCryptoCurrency | FormStateTradingFiatCurrency;
      };

export type ReviewOutputType = ReviewOutput['type'];

export type ReviewOutputState = 'active' | 'success' | undefined;
