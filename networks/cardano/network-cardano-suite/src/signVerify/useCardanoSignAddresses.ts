import { useMemo } from 'react';

import { type SignAddress, useAccountSignAddresses } from '@suite/sign-verify';
import { type Account } from '@suite-common/wallet-types';
import { getStakingPath } from '@suite-common/wallet-utils';

/** Cardano also signs with the stake address, which comes first. */
export const useCardanoSignAddresses = (account: Account): SignAddress[] => {
    const accountAddresses = useAccountSignAddresses(account);
    const stakingPath = getStakingPath(account);
    const stakeAddress = account.networkType === 'cardano' ? account.misc.staking.address : '';

    return useMemo<SignAddress[]>(
        () => [
            { path: stakingPath, address: stakeAddress, category: 'TR_STAKING_STAKE_ADDRESS' },
            ...accountAddresses,
        ],
        [stakingPath, stakeAddress, accountAddresses],
    );
};
