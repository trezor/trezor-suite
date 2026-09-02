import { type Account } from '@suite-common/wallet-types';
import { getAccountTotalStakingBalance, isCardanoStakingActive } from '@suite-common/wallet-utils';

export const hasAccountActiveStaking = (account: Account): boolean => {
    const stakedBalance = getAccountTotalStakingBalance(account);

    return (!!stakedBalance && stakedBalance !== '0') || isCardanoStakingActive(account);
};
