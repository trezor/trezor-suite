import { type StakingProductId } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';

import { deriveStakingPositions } from './deriveStakingPositions';
import { type StakingPosition } from './positionsTypes';
import { summarizeStakingPositions } from './summarizeStakingPositions';
import { type AccountsRootState } from '../../accounts/accountsReducer';
import { selectAccountByKey } from '../../accounts/accountsSelectors';

const createMemoizedSelector = createWeakMapSelector.withTypes<AccountsRootState>();

export const selectStakingPositions = createMemoizedSelector(
    [selectAccountByKey],
    (account): StakingPosition[] =>
        account ? deriveStakingPositions(account) : returnStableArrayIfEmpty(),
);

export const selectStakingPosition = (
    state: AccountsRootState,
    accountKey: AccountKey,
    productId: StakingProductId,
): StakingPosition | null =>
    selectStakingPositions(state, accountKey).find(position => position.productId === productId) ??
    null;

export const selectAccountHasStakingPosition = (state: AccountsRootState, accountKey: AccountKey) =>
    selectStakingPositions(state, accountKey).length > 0;

// Sums across every product the account has a position with.
export const selectAccountStakingSummary = createMemoizedSelector(
    [selectStakingPositions],
    summarizeStakingPositions,
);
