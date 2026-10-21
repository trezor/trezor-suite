import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import { getCardanoAccountPoolId, selectBestCardanoPool } from '../cardano/cardanoStakingUtils';
import { getAccountEthereumStakingProviderId } from '../ethereum/ethereumStakingUtils';
import { DEFAULT_ETHEREUM_STAKING_PROVIDER_ID } from '../ethereum/providers/ethereumStakingProviders';
import { type StakeSliceRootState } from '../stakingReducerTypes';

export const selectStake = (state: StakeSliceRootState) => state.wallet.stake;

export const selectStakeData = (state: StakeSliceRootState) => selectStake(state).data.data;

export const selectStakeAccountKey = (state: StakeSliceRootState) => selectStake(state).accountKey;

interface SelectPoolStatsApyProps {
    account?: Account;
    networkSymbol?: NetworkSymbol;
}

export const selectPoolStatsApy = (
    state: StakeSliceRootState,
    { account, networkSymbol }: SelectPoolStatsApyProps,
) => {
    const data = selectStakeData(state);
    const symbol = account?.symbol ?? networkSymbol;

    if (!symbol || !data) {
        return null;
    }

    switch (symbol) {
        case 'eth': {
            const providerId = account
                ? getAccountEthereumStakingProviderId(account)
                : DEFAULT_ETHEREUM_STAKING_PROVIDER_ID;

            return data.eth?.[providerId]?.stats?.apy ?? null;
        }

        case 'sol':
            return data.sol?.stats?.apy ?? null;

        case 'ada': {
            const poolStats = data.ada?.pools ?? [];
            const accountPoolId = getCardanoAccountPoolId(account);

            if (accountPoolId) {
                // The account's own APY, or null when staked outside Everstake (no pool stats).
                // For the promoted APY, query by networkSymbol instead.
                const poolFromAccount = poolStats.find(pool => pool.id === accountPoolId);

                return poolFromAccount?.apy ?? null;
            }

            // No active delegation (not staking yet, or queried by network) → promote best pool.
            const bestPoolId = selectBestCardanoPool(poolStats).bech32;
            const bestPool = bestPoolId
                ? poolStats.find(pool => pool.id === bestPoolId)
                : undefined;

            return bestPool?.apy ?? null;
        }

        default:
            return null;
    }
};
