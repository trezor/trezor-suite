import { type Account, type TronResourceType } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

export const getStakedBalance = (account: Account, resourceType: TronResourceType): string => {
    const stakingInfo =
        account.networkType === 'tron' ? account.misc.tronResources?.stakingInfo : undefined;

    const staked =
        resourceType === 'energy'
            ? stakingInfo?.stakedBalanceEnergy
            : stakingInfo?.stakedBalanceBandwidth;

    const delegated =
        resourceType === 'energy'
            ? stakingInfo?.delegatedBalanceEnergy
            : stakingInfo?.delegatedBalanceBandwidth;

    const unstakeable = BigNumber.max(new BigNumber(staked ?? 0).minus(delegated ?? 0), 0);

    return subunitsToUnits({
        value: asAmountSubunit(unstakeable),
        symbol: account.symbol,
    }).toString();
};

export const getCurrentResource = (account: Account, resourceType: TronResourceType): number => {
    const tronResources = account.networkType === 'tron' ? account.misc.tronResources : undefined;

    if (!tronResources) {
        return 0;
    }

    return resourceType === 'energy'
        ? tronResources.totalEnergy
        : tronResources.totalStakedBandwidth;
};
