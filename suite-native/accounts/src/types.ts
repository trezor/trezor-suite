import { Account, TokenAddress } from '@suite-common/wallet-types';

export type GroupedByTypeAccounts = Record<string, [Account, ...Account[]]>;

export type OnSelectAccount = (params: {
    account: Account;
    tokenAddress?: TokenAddress;
    hasAnyTokensWithFiatRates: boolean;
    hasStaking?: boolean;
}) => void;
