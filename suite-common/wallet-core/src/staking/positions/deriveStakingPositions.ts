import { type Account, type AccountWithNetworkType } from '@suite-common/wallet-types';
import { returnStableArrayIfEmpty, weakMapMemoize } from '@trezor/redux-utils';
import { isNotNull } from '@trezor/utils';

import { type StakingPosition } from './positionsTypes';
import { listEthereumStakingAdapters } from '../ethereum/providers/ethereumStakingProviders';

const LOG_PREFIX = 'deriveEthereumStakingPositions';

const createStableArray = weakMapMemoize((...positions: StakingPosition[]) => positions);

type EthereumAccount = AccountWithNetworkType<'ethereum'>;

// A backend reporting a pool no provider claims would otherwise read as "nothing staked".
// Contract addresses are public, so they can be logged.
const reportUnclaimedStakingPools = (account: EthereumAccount) => {
    const contracts = account.misc?.stakingPools?.map(pool => pool.contract) ?? [];
    if (contracts.length === 0) return;

    console.error(
        `${LOG_PREFIX}: no ${account.symbol} staking provider matches the account's staking pools (${contracts.join(', ')})`,
    );
};

// Memoized on the account object: the positions of an unchanged account keep their references.
export const deriveEthereumStakingPositions = weakMapMemoize(
    (account: Account): StakingPosition[] => {
        if (account.networkType !== 'ethereum') {
            return returnStableArrayIfEmpty();
        }

        const positions = listEthereumStakingAdapters(account.symbol)
            .map(adapter => adapter.derivePosition(account))
            .filter(isNotNull);

        if (positions.length === 0) {
            reportUnclaimedStakingPools(account);
        }

        return returnStableArrayIfEmpty(createStableArray(...positions));
    },
);
