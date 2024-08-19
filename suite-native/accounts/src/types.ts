import { Account, TokenAddress } from '@suite-common/wallet-types';

export type GroupedByTypeAccounts = Record<string, [Account, ...Account[]]>;

export type OnSelectAccount = (params: {
    account: Account;
    tokenContract?: TokenAddress;
    hasAnyTokensWithFiatRates: boolean;
}) => void;
