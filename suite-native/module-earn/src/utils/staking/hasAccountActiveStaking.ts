import { type NetworkConfigDeps } from '@suite-common/networks';
import { isCardanoStakingActive } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getAccountTotalStakingBalance } from '@suite-common/wallet-utils';

export const hasAccountActiveStaking = (
    networkConfigDeps: NetworkConfigDeps,
    account: Account,
): boolean => {
    const stakedBalance = getAccountTotalStakingBalance(networkConfigDeps, account);

    return (!!stakedBalance && stakedBalance !== '0') || isCardanoStakingActive(account);
};
