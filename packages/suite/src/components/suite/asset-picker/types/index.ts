import { Account } from '@suite-common/wallet-types';

import { TokensWithRates } from 'src/utils/wallet/tokenUtils';

export type AssetGroupSpaceSize = 'md' | 'lg';

export type AccountWithTokensOption =
    | {
          type: 'account';
          account: Account;
          height: number;
      }
    | {
          type: 'token';
          account: Account;
          token: TokensWithRates;
          height: number;
      }
    | {
          type: 'hidden-tokens';
          account: Account;
          tokens: TokensWithRates[];
          height: number;
          expanded: boolean;
      };
