import {
    type Account,
    type TokenAddress,
    type TokenInfoBranded,
    type TokenSymbol,
} from '@suite-common/wallet-types';

export type OnSelectAccount = (params: {
    account: Account;
    // if clicked item is staking item
    isStaking?: boolean;
    tokenAddress?: TokenAddress;
    tokenSymbol?: TokenSymbol;
    hasAnyKnownTokens: boolean;
}) => void;

export type AccountListSection = (
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
    | {
          type: 'zeroBalance';
          account: Account;
          tokens: TokenInfoBranded[];
      }
) & {
    isFirst?: boolean;
    isLast?: boolean;
};
