import { useMemo } from 'react';

import { type Account } from '@suite-common/wallet-types';
import { getStakingPath } from '@trezor/network-cardano-suite-common';

import { type SignAddress } from '../types';
import { useAccountSignAddresses } from '../useAccountSignAddresses';

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
