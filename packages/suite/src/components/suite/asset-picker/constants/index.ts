import { TranslationKey } from '@suite-common/intl-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { BaseCurrencyAmount } from '@suite-common/wallet-utils';

export type AssetRowProps =
    | {
          type: 'group-space-lg' | 'group-space-md';
      }
    | {
          type: 'group-label';
          data: {
              label: TranslationKey;
          };
      }
    | {
          type: 'asset';
          data: {
              networkSymbol: NetworkSymbol;
              coingeckoId: string;

              name: string;
              symbol: string;
              contractAddress?: string;

              amount?: string;
              fiatAmount?: BaseCurrencyAmount;
          };
      }
    | {
          type: 'account';
          data: {
              account: Account;
          };
          onClick: (account: Account) => void;
      };

export type AssetRowGroupLabelDataProps = Extract<AssetRowProps, { type: 'group-label' }>['data'];
export type AssetRowAssetDataProps = Extract<AssetRowProps, { type: 'asset' }>['data'];
export type AssetRowAccountDataProps = Extract<AssetRowProps, { type: 'account' }>['data'];

export const ASSET_ROW_HEIGHTS = {
    'group-label': 24,
    'group-space-md': 24,
    'group-space-lg': 32,
    asset: 68,
    account: 68,
} as const satisfies Record<AssetRowProps['type'], number>;
