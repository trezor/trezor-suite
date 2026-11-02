import { type Account, type TokenAddress } from '@suite-common/wallet-types';

import { isPositiveBalance } from './balanceUtils';
import { findToken } from './sendFormUtils';
import { isStellarContractToken } from './transactionUtils';

type HasAccountOrTokenSpendableBalanceParams = {
    account: Account | null | undefined;
    tokenContract?: TokenAddress;
};

export const hasAccountOrTokenSpendableBalance = ({
    account,
    tokenContract,
}: HasAccountOrTokenSpendableBalanceParams): boolean => {
    if (!account) return false;

    if (tokenContract === undefined) {
        return isPositiveBalance(account.availableBalance);
    }

    const token = findToken(account.tokens, tokenContract);

    // Stellar contract tokens do not have a send composer yet.
    if (!token || isStellarContractToken(token)) return false;

    return isPositiveBalance(token.balance ?? '0');
};
