import type { WalletAccountTransaction } from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';

import { stakingActions } from '../state/stakingReducer';
import type { StakingSessionKey } from '../state/stakingSessionKey';
import {
    type AwaitingStakingStep,
    getAwaitingStakingSteps,
} from '../state/stakingSessionSelectors';
import type { StakingStepTransaction } from '../state/stakingSessionStep';
import type { StakingSession } from '../state/stakingSessionsReducer';

export type StakingStepSettlement = {
    sessionKey: StakingSessionKey;
    stepId: string;
    txid: string;
    outcome: 'confirmed' | 'failed' | 'replaced';
};

const getStakingStepOutcome = (
    mined: StakingStepTransaction,
    transaction: WalletAccountTransaction,
): StakingStepSettlement['outcome'] => {
    if (mined.isCancellation) return 'replaced';

    return transaction.type === 'failed' ? 'failed' : 'confirmed';
};

// A step settles on whichever of its transactions mines: the original or a bump confirms it,
// a cancel replaces it, and a transaction the chain rejected fails it.
export const getStakingStepSettlement = (
    awaiting: AwaitingStakingStep,
    transaction: WalletAccountTransaction | null,
): StakingStepSettlement | null => {
    if (transaction === null || isPending(transaction)) return null;

    const mined = awaiting.transactions.find(({ txid }) => txid === transaction.txid);

    if (mined === undefined) return null;

    return {
        sessionKey: awaiting.sessionKey,
        stepId: awaiting.stepId,
        txid: mined.txid,
        outcome: getStakingStepOutcome(mined, transaction),
    };
};

type SettleStakingStepsParams = {
    sessions: readonly StakingSession[];
    transactions: readonly WalletAccountTransaction[];
};

export const settleStakingSteps = ({
    sessions,
    transactions,
}: SettleStakingStepsParams): StakingStepSettlement[] =>
    getAwaitingStakingSteps(sessions).flatMap(awaiting => {
        const settlement = transactions.reduce<StakingStepSettlement | null>(
            (found, transaction) => found ?? getStakingStepSettlement(awaiting, transaction),
            null,
        );

        return settlement === null ? [] : [settlement];
    });

export const getStakingStepSettlementAction = ({
    sessionKey,
    stepId,
    txid,
    outcome,
}: StakingStepSettlement) => {
    if (outcome === 'confirmed') {
        return stakingActions.stepConfirmed({ sessionKey, stepId, txid });
    }

    return stakingActions.stepFailed({
        sessionKey,
        stepId,
        txid,
        error: { kind: outcome === 'replaced' ? 'replaced' : 'confirmation-failed', code: null },
    });
};
