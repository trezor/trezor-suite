import { useMemo } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type StablecoinYieldAccountRewards } from '@suite-common/wallet-core';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { YieldClaimRewardRow } from './YieldClaimRewardRow';

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
    const claimableAmount = useMemo(
        () =>
            subunitsToUnits({
                value: asAmountSubunit(new BigNumber(reward.claimable)),
                decimals: reward.token.decimals,
            }).toString(),
        [reward.claimable, reward.token.decimals],
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
