import type { WalletAccountTransaction } from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';

import { stakingActions } from '../state/stakingReducer';
import type { StakingSessionKey } from '../state/stakingSessionKey';
import type { StakingSession } from '../state/stakingSessionsReducer';

export type AwaitingStakingStep = {
    sessionKey: StakingSessionKey;
    stepId: string;
    txid: string;
};

export type StakingStepSettlement = AwaitingStakingStep & {
    outcome: 'confirmed' | 'failed';
};

export const getAwaitingStakingSteps = (
    sessions: readonly StakingSession[],
): AwaitingStakingStep[] =>
    sessions.flatMap(session =>
        session.steps.flatMap(step =>
            step.status === 'awaiting'
                ? [{ sessionKey: session.key, stepId: step.id, txid: step.txid }]
                : [],
        ),
    );

export const getStakingStepSettlement = (
    awaiting: AwaitingStakingStep,
    transaction: WalletAccountTransaction | null,
): StakingStepSettlement | null => {
    if (transaction?.txid !== awaiting.txid || isPending(transaction)) return null;

    return { ...awaiting, outcome: transaction.type === 'failed' ? 'failed' : 'confirmed' };
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
        const settlement = getStakingStepSettlement(
            awaiting,
            transactions.find(transaction => transaction.txid === awaiting.txid) ?? null,
        );

        return settlement === null ? [] : [settlement];
    });

export const getStakingStepSettlementAction = ({
    sessionKey,
    stepId,
    outcome,
}: StakingStepSettlement) =>
    outcome === 'confirmed'
        ? stakingActions.stepConfirmed({ sessionKey, stepId })
        : stakingActions.stepFailed({
              sessionKey,
              stepId,
              error: { kind: 'confirmation-failed', code: null },
          });
