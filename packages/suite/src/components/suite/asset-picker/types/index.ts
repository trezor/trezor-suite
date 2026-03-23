import { type AccountWithSuiteSyncLabel } from '@suite-common/suite-sync';

import { type TokensWithRates } from 'src/utils/wallet/tokenUtils';

export type AssetGroupSpaceSize = 'md' | 'lg';

export type AccountWithTokensOption =
    | {
          type: 'account';
          account: AccountWithSuiteSyncLabel;
          height: number;
      }
    | {
          type: 'token';
          account: AccountWithSuiteSyncLabel;
          token: TokensWithRates;
          height: number;
      }
    | {
          type: 'hidden-tokens';
          account: AccountWithSuiteSyncLabel;
          tokens: TokensWithRates[];
          height: number;
          expanded: boolean;
      }
    | {
          type: 'non-tradable-tokens';
          account: AccountWithSuiteSyncLabel;
          tokens: TokensWithRates[];
          height: number;
          expanded: boolean;
      };
