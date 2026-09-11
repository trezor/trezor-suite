import { TokenInfo } from '@trezor/connect';
import { FormStateTradingCryptoCurrency, FormStateTradingFiatCurrency } from './sendForm';
import { YieldClaimReward } from './stablecoinYield';

export type TransactionReviewOutput =
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
              | 'contract_intent'
              | 'tron-vote'
              | 'tron-withdraw'
              | 'tron-claim'
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
          receive?: FormStateTradingCryptoCurrency | FormStateTradingFiatCurrency;
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

export type TransactionReviewOutputType = TransactionReviewOutput['type'];
export type TransactionReviewOutputState = 'active' | 'success' | undefined;

export type TransactionReviewStatefulOutput = TransactionReviewOutput & {
    state: TransactionReviewOutputState;
};

export type TransactionReviewSummaryOutput = {
    state: TransactionReviewOutputState;
    totalSpent: string;
    fee: string;
};
