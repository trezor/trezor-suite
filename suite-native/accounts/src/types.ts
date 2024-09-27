import { Account, TokenAddress, TokenInfoBranded } from '@suite-common/wallet-types';

export type GroupedByTypeAccounts = Record<string, [Account, ...Account[]]>;

export type OnSelectAccount = (params: {
    account: Account;
    isStaking?: boolean;
    tokenAddress?: TokenAddress;
    hasAnyKnownTokens: boolean;
}) => void;

export type AccountSelectBottomSheetSection = (
    | {
          type: 'sectionTitle';
          account: Account;
          hasAnyKnownTokens: boolean;
          fiatBalance?: string;
      }
    | {
          type: 'account';
          account: Account;
          hasAnyKnownTokens: boolean;
      }
    | {
          type: 'staking';
          account: Account;
          stakingCryptoBalance: string;
      }
    | {
          type: 'token';
          account: Account;
          token: TokenInfoBranded;
      }
) & {
    isFirst?: boolean;
    isLast?: boolean;
};
