import { type TronAccountExtraData } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import { type TronResourceType } from './tronStakeTypes';

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
