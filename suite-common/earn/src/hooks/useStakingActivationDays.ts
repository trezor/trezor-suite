import { useSelector } from 'react-redux';

import {
    type StakingRootState,
    selectStakingAccountPositionEntry,
    useStakingDaysUntil,
} from '@suite-common/earn-staking';
import { useEthereumValidatorsQueue } from '@suite-common/earn-staking-api';
import { getNetworkType } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

const SECOND_MS = 1000;

// An Ethereum deposit waits in the validators queue as it stood when the stake mined, so the days
// until activation read the queue at that time, as legacy did; the position dates it from today's.
export const useStakingActivationDays = (accountKey: AccountKey): number | null => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const positionEntry = useSelector((state: StakingRootState) =>
        selectStakingAccountPositionEntry(state, accountKey),
    );

    const activation = positionEntry?.position.activations[0] ?? null;
    const startedAt = activation?.startedAt ?? null;

    const isQueued =
        startedAt !== null &&
        positionEntry !== null &&
        getNetworkType(positionEntry.descriptor.networkSymbol) === 'ethereum';

    const { data: queue } = useEthereumValidatorsQueue(
        {
            account: account ?? null,
            timestamp: startedAt === null ? undefined : Math.floor(startedAt / SECOND_MS),
        },
        { enabled: isQueued && account !== undefined },
    );

    const queuedAvailableAt =
        isQueued && queue?.addingDelay !== undefined && queue.activationTime !== undefined
            ? startedAt + (queue.addingDelay + queue.activationTime) * SECOND_MS
            : null;

    return useStakingDaysUntil(queuedAvailableAt ?? activation?.availableAt ?? null);
};
