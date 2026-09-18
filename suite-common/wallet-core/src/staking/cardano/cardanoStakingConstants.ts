import { BigNumber } from '@trezor/utils';

import { type VotingDelegationOption } from './cardanoStakingTypes';

export const MIN_CARDANO_AMOUNT_FOR_STAKING = new BigNumber(0);
export const MAX_CARDANO_AMOUNT_FOR_STAKING = new BigNumber(72_000_000);
export const MIN_CARDANO_FOR_WITHDRAWALS = new BigNumber(0);

export const MIN_CARDANO_BALANCE_FOR_FEE_BUFFER = new BigNumber(0);
export const MIN_CARDANO_BALANCE_FOR_STAKING = MIN_CARDANO_AMOUNT_FOR_STAKING.plus(
    MIN_CARDANO_FOR_WITHDRAWALS,
);

export const CARDANO_ALWAYS_ABSTAIN_DREP_ID = 'drep_always_abstain';

export const DEFAULT_VOTING_OPTION: VotingDelegationOption = { type: 'abstain' };
