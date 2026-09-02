import { type NetworkSymbol } from '@suite-common/wallet-config';
import { toTokenAddress } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { type YieldFlowCompleteRewardItem } from '../yieldTypes';

interface YieldClaimableReward {
    token: {
        address: string;
        symbol: string;
        decimals: number;
    };
    claimable: BigNumber | string;
    fiat: {
        claimable: BigNumber | null;
    };
}

interface GetYieldClaimRewardsSnapshotProps {
    networkSymbol: NetworkSymbol;
    rewards: YieldClaimableReward[];
}

export const getYieldClaimRewardsSnapshot = ({
    networkSymbol,
    rewards,
}: GetYieldClaimRewardsSnapshotProps): YieldFlowCompleteRewardItem[] =>
    rewards.map(reward => ({
        token: {
            networkSymbol,
            symbol: reward.token.symbol,
            decimals: reward.token.decimals,
            contractAddress: toTokenAddress(reward.token.address),
        },
        value: subunitsToUnits({
            value: asAmountSubunit(new BigNumber(reward.claimable)),
            decimals: reward.token.decimals,
        }).toString(),
        fiatValue: reward.fiat.claimable?.toString() ?? null,
    }));
