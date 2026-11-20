import { type StakingAmount, stakingAmountSchema } from '@suite-common/earn-staking-common';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

export type EverstakePoolDeployment = {
    poolAddress: string;
    minStakeAmount: StakingAmount;
};

// Each pool contract enforces its own minimum stake, so the minimum belongs to the deployment.
const EVERSTAKE_POOL_DEPLOYMENTS: Partial<Record<NetworkSymbol, EverstakePoolDeployment>> = {
    [asNetworkSymbol('eth')]: {
        poolAddress: '0xD523794C879D9eC028960a231F866758e405bE34',
        minStakeAmount: stakingAmountSchema.parse('10000000000000000'),
    },
    [asNetworkSymbol('thod')]: {
        poolAddress: '0x7967AcFc9EB46cA2d20076B61B05e224F2d0B8b3',
        minStakeAmount: stakingAmountSchema.parse('100000000000000000'),
    },
};

export const getEverstakePoolDeployment = (
    networkSymbol: NetworkSymbol,
): EverstakePoolDeployment => {
    const deployment = EVERSTAKE_POOL_DEPLOYMENTS[networkSymbol];

    if (deployment === undefined) {
        throw new Error(`Everstake has no pool contract on ${networkSymbol}`);
    }

    return deployment;
};
