import { type ReactNode } from 'react';

import { type Account } from '@suite-common/wallet-types';

import { type TokensWithRates } from 'src/utils/wallet/tokenUtils';

export type AssetGroupSpaceSize = 'md' | 'lg';
export type AccountWithOptionalLabel = Account & { label?: string | null };

export type AccountWithTokensOption =
    | {
          type: 'account';
          account: AccountWithOptionalLabel;
      }
    | {
          type: 'token';
          account: AccountWithOptionalLabel;
          token: TokensWithRates;
      }
    | {
          type: 'hidden-tokens';
          account: AccountWithOptionalLabel;
          tokens: TokensWithRates[];
          expanded: boolean;
      };

export type AssetRowOption = Extract<AccountWithTokensOption, { type: 'account' | 'token' }>;

type AssetGroupOptionShape = {
    account: AccountWithOptionalLabel;
    items: AssetRowOption[];
    expanded: boolean;
};

export type AssetGroupOption =
    | ({ type: 'low-balance-group' } & AssetGroupOptionShape)
    | ({ type: 'non-tradable-group' } & AssetGroupOptionShape);

export type AssetPickerOption = AccountWithTokensOption | AssetGroupOption;

export type AssetPickerListItem =
    | AssetPickerOption
    | {
          type: 'group-label';
          label: ReactNode;
      }
    | {
          type: 'group-space';
          size: AssetGroupSpaceSize;
      };
