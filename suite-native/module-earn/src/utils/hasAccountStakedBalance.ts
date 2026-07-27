import { type Account } from '@suite-common/wallet-types';
import { getAccountTotalStakingBalance } from '@suite-common/wallet-utils';

export const hasAccountStakedBalance = (account: Account): boolean => {
    const stakedBalance = getAccountTotalStakingBalance(account);

    return !!stakedBalance && stakedBalance !== '0';
};
