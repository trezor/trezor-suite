import { selectNetworkConfigDeps } from '@suite-common/networks';
import { useServices } from '@suite-common/dependency-injection';
import { useMemo } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { YieldClaimRewardRow } from './YieldClaimRewardRow';
import { type StablecoinYieldAccountRewards } from '../../utils/yield/stablecoinYieldClaimSummaryUtils';

type StablecoinYieldClaimReward = StablecoinYieldAccountRewards['rewards'][number];

type YieldClaimRewardItemProps = {
    isFiatLoading: boolean;
    networkSymbol: NetworkSymbol;
    reward: StablecoinYieldClaimReward;
};

export const YieldClaimRewardItem = ({
    isFiatLoading,
    networkSymbol,
    reward,
}: YieldClaimRewardItemProps) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const claimableAmount = useMemo(
        () =>
            subunitsToUnits(networkConfigDeps, {
                value: asAmountSubunit(new BigNumber(reward.claimable)),
                decimals: reward.token.decimals,
            }).toString(),
        [networkConfigDeps, reward.claimable, reward.token.decimals],
    );

    return (
        <YieldClaimRewardRow
            amount={claimableAmount}
            fiatAmount={reward.fiat.claimable}
            isFiatLoading={isFiatLoading}
            networkSymbol={networkSymbol}
            tokenContractAddress={reward.token.address}
            tokenDecimals={reward.token.decimals}
            tokenSymbol={reward.token.symbol}
        />
    );
};
