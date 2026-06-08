import { type AccountKey } from '@suite-common/wallet-types';

import {
    type TronStakeRootState,
    type TronStakeState,
    initialTronStakeSession,
} from './tronStakeReducer';

export const selectTronStakeSession = (
    state: TronStakeRootState,
    accountKey: AccountKey,
): TronStakeState => state.wallet.tronStake[accountKey] ?? initialTronStakeSession;
