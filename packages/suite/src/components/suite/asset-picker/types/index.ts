import { type Account } from '@suite-common/wallet-types';

import { type TokensWithRates } from 'src/utils/wallet/tokenUtils';

export type AssetGroupSpaceSize = 'md' | 'lg';
export type AccountWithOptionalLabel = Account & { label?: string | null };

export type AccountWithTokensOption =
    | {
          type: 'account';
          account: AccountWithOptionalLabel;
          height: number;
      }
    | {
          type: 'token';
          account: AccountWithOptionalLabel;
          token: TokensWithRates;
          height: number;
      }
    | {
          type: 'hidden-tokens';
          account: AccountWithOptionalLabel;
          tokens: TokensWithRates[];
          height: number;
          expanded: boolean;
      };

export type AssetRowOption = Extract<AccountWithTokensOption, { type: 'account' | 'token' }>;

type AssetGroupOptionShape = {
    account: AccountWithOptionalLabel;
    items: AssetRowOption[];
    height: number;
    expanded: boolean;
};

export type AssetGroupOption =
    | ({ type: 'low-balance-group' } & AssetGroupOptionShape)
    | ({ type: 'non-tradable-group' } & AssetGroupOptionShape);

export type AssetPickerOption = AccountWithTokensOption | AssetGroupOption;
