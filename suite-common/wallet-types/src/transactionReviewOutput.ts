import type { TokenInfo } from '@trezor/connect';

import { type FormStateTradingCryptoCurrency, type FormStateTradingFiatCurrency } from './sendForm';
import type { YieldClaimReward } from './stablecoinYield';

export type ReviewOutput =
    | {
          type:
              | 'opreturn'
              | 'data'
              | 'note'
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
              | 'recipient_name'
              | 'swap_intent'
              | 'tron-vote'
              | 'fee-limit';
          label?: string;
          value: string;
          value2?: string;
          token?: TokenInfo;
          send?: undefined;
          receive?: undefined;
          receiveAddress?: undefined;
      }
    | {
          type: 'fee-replace';
          label?: undefined;
          value: string;
          value2: string;
          token?: undefined;
          send?: undefined;
          receive?: undefined;
          receiveAddress?: undefined;
      }
    | {
          type: 'reduce-output';
          label: string;
          value: string;
          value2: string;
          token?: undefined;
          send?: undefined;
          receive?: undefined;
          receiveAddress?: undefined;
      }
    | {
          type: 'traded_assets';
          value: string;
          value2: string;
          label?: undefined;
          token?: undefined;
          send: FormStateTradingCryptoCurrency;
          receive: FormStateTradingCryptoCurrency | FormStateTradingFiatCurrency;
          receiveAddress?: string;
      }
    | {
          type: 'rewards';
          rewards: YieldClaimReward[];
          value?: undefined;
          value2?: undefined;
          label?: undefined;
          token?: undefined;
          send?: undefined;
          receive?: undefined;
          receiveAddress?: undefined;
      };

export type ReviewOutputType = ReviewOutput['type'];

export type ReviewOutputState = 'active' | 'success' | undefined;
