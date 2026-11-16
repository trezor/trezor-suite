import {
    type StakingRootState,
    selectCountedStakingPositionEntriesByAccount,
} from '@suite-common/earn-staking';
import { type StakingPositionDetails } from '@suite-common/earn-staking-common';
import { type AccountKey } from '@suite-common/wallet-types';

export type TronStakingDetails = Extract<StakingPositionDetails, { kind: 'tron-staking' }>;

export const selectTronStakingDetails = (
    state: StakingRootState,
    accountKey: AccountKey,
): TronStakingDetails | null => {
    const details =
        selectCountedStakingPositionEntriesByAccount(state, accountKey)[0]?.position.details ??
        null;

    return details?.kind === 'tron-staking' ? details : null;
};
