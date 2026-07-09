import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

type AccountToken = NonNullable<Account['tokens']>[number];

const isAccountTokenContractMatch = (
    account: Account,
    normalizedContract: string,
    accountTokenContract: string,
) => {
    const normalizedAccountTokenContract = getContractAddressForNetworkSymbol(
        account.symbol,
        accountTokenContract,
    );

    return normalizedAccountTokenContract === normalizedContract;
};

export const getAccountTokenByContract = (
    account: Account,
    tokenContract: string | null,
): AccountToken | null => {
    if (!tokenContract) {
        return null;
    }

    const normalizedContract = getContractAddressForNetworkSymbol(account.symbol, tokenContract);

    return (
        account.tokens?.find(token =>
            isAccountTokenContractMatch(account, normalizedContract, token.contract),
        ) ?? null
    );
};

export const hasPositiveContractTokenBalance = (
    account: Account,
    tokenContract: TokenAddress | null,
): boolean => {
    if (!tokenContract) {
        return false;
    }

    const normalizedContract = getContractAddressForNetworkSymbol(account.symbol, tokenContract);

    return (
        account.tokens?.some(
            token =>
                isAccountTokenContractMatch(account, normalizedContract, token.contract) &&
                new BigNumber(token.balance ?? '0').gt(0),
        ) ?? false
    );
};
