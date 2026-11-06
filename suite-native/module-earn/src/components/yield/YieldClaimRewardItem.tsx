import { useTokenMetadata } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
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
    const contract = reward.token.address ? toTokenAddress(reward.token.address) : undefined;
    const token = useTokenMetadata(networkSymbol, contract);
    const decimals = contract ? token?.decimals : getNetwork(networkSymbol).decimals;
    if (decimals === undefined) return null;
    const claimableAmount = subunitsToUnits({
        value: asAmountSubunit(new BigNumber(reward.claimable)),
        decimals,
    }).toString();

    return (
        <YieldClaimRewardRow
            amount={claimableAmount}
            fiatAmount={reward.fiat.claimable}
            isFiatLoading={isFiatLoading}
            networkSymbol={networkSymbol}
            tokenContractAddress={reward.token.address}
        />
    );
};
