import { type Account, type AccountWithNetworkType } from '@suite-common/wallet-types';
import { returnStableArrayIfEmpty, weakMapMemoize } from '@trezor/redux-utils';

import { type StakingPosition } from './positionsTypes';
import { listStakingProductAdapters } from '../products/stakingProductAdapters';

const LOG_PREFIX = 'deriveStakingPositions';

const createStableArray = weakMapMemoize((...positions: StakingPosition[]) => positions);

type EthereumAccount = AccountWithNetworkType<'ethereum'>;

// A backend reporting a pool no product claims would otherwise read as "nothing staked".
// Contract addresses are public, so they can be logged.
const reportUnclaimedStakingPools = (account: EthereumAccount) => {
    const contracts = account.misc?.stakingPools?.map(pool => pool.contract) ?? [];

    if (contracts.length === 0) return;

    console.error(
        `${LOG_PREFIX}: no ${account.symbol} staking product matches the account's staking pools (${contracts.join(', ')})`,
    );
};

// Memoized on the account object: the positions of an unchanged account keep their references.
export const deriveStakingPositions = weakMapMemoize((account: Account): StakingPosition[] => {
    const positions = listStakingProductAdapters(account.symbol).flatMap(adapter =>
        adapter.derivePositions(account),
    );

    if (positions.length === 0 && account.networkType === 'ethereum') {
        reportUnclaimedStakingPools(account);
    }

    return returnStableArrayIfEmpty(createStableArray(...positions));
});
