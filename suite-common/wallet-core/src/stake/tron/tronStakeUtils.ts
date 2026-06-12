import { type Account } from '@suite-common/wallet-types';
import { type TronAccountExtraData } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import { type TronResourceType } from './tronStakeTypes';

export const getWithdrawableAmount = (account: Account): string => {
    const stakingInfo =
        account.networkType === 'tron' ? account.misc.tronResources?.stakingInfo : undefined;

    const nowSeconds = Date.now() / 1000;

    return (stakingInfo?.unstakingBatches ?? [])
        .reduce(
            (total, batch) => (batch.expireTime <= nowSeconds ? total.plus(batch.amount) : total),
            new BigNumber(0),
        )
        .toString();
};

export const getResourceGain = (
    amount: string,
    resourceType: TronResourceType,
    resources: TronAccountExtraData | undefined,
): number | null => {
    const trx = new BigNumber(amount);

    if (!trx.isFinite() || trx.lte(0) || !resources) {
        return null;
    }

    const [limit, weight] =
        resourceType === 'energy'
            ? [resources.totalEnergyLimit, resources.totalEnergyWeight]
            : [resources.totalBandwidthLimit, resources.totalBandwidthWeight];

    if (!limit || !weight) {
        return null;
    }

    return trx.times(limit).div(weight).toNumber();
};
