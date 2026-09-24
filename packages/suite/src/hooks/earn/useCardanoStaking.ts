import { useCallback, useState } from 'react';

import { selectSelectedAccount } from '@suite/account';
import {
    hasPendingStakeTypeTransaction,
    isCardanoWithdrawalBlockedByMissingDrep,
    selectCardanoPoolsInfo,
    selectStakeVotingDelegation,
} from '@suite-common/wallet-core';
import {
    type ActionAvailability,
    type ActionUnavailableReason,
    type CardanoAction,
    type CardanoStaking,
} from '@suite-common/wallet-types';
import { type PrecomposedTransactionCardano } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';
import { isArrayMember } from '@trezor/utils';

import { prepareTxPlan } from 'src/actions/wallet/stake/stakeFormCardanoActions';
import { useSelector } from 'src/hooks/suite';

const COMPOSE_ERROR_REASONS = [
    'UTXO_BALANCE_INSUFFICIENT',
    'UTXO_VALUE_TOO_SMALL',
] as const satisfies readonly ActionUnavailableReason[];

const getComposeErrorReason = (error: string): ActionUnavailableReason =>
    isArrayMember(error, COMPOSE_ERROR_REASONS) ? error : 'COMPOSE_FAILED';

const getActionAvailability = (txPlan: PrecomposedTransactionCardano): ActionAvailability => {
    switch (txPlan.type) {
        case 'final':
            return { status: true };
        case 'nonfinal':
            return { status: false, reason: 'TX_NOT_FINAL' };
        case 'error':
            return { status: false, reason: getComposeErrorReason(txPlan.error) };
        default:
            return exhaustive(txPlan);
    }
};

export const useCardanoStaking = (): CardanoStaking => {
    const account = useSelector(selectSelectedAccount);

    const isCardano = account?.networkType === 'cardano';

    const cardanoPools = useSelector(selectCardanoPoolsInfo);
    const votingDelegation = useSelector(selectStakeVotingDelegation);
    const hasPendingTx = useSelector(state =>
        account ? hasPendingStakeTypeTransaction(state, account.key) : false,
    );

    const [deposit, setDeposit] = useState<undefined | string>(undefined);
    const [fee, setFee] = useState<undefined | string>(undefined);
    const [loading, setLoading] = useState<boolean>(false);
    const [delegatingAvailable, setDelegatingAvailable] = useState<
        CardanoStaking['delegatingAvailable']
    >({
        status: false,
    });
    const [withdrawingAvailable, seWithdrawingAvailable] = useState<
        CardanoStaking['withdrawingAvailable']
    >({
        status: false,
    });

    const { rewards: rewardsAmount } = isCardano ? account.misc.staking : {};

    const isStakingDisabled =
        (account?.availableBalance === '0' || !delegatingAvailable.status || hasPendingTx) &&
        !loading;

    const calculateFeeAndDeposit = useCallback(
        async (action: CardanoAction) => {
            if (!account) return;

            if (
                (action === 'withdrawal' || action === 'deregister') &&
                isCardanoWithdrawalBlockedByMissingDrep(account)
            ) {
                seWithdrawingAvailable({ status: false, reason: 'DREP_DELEGATION_REQUIRED' });

                return;
            }

            setLoading(true);
            try {
                const composeRes = await prepareTxPlan({
                    account,
                    action,
                    cardanoPools,
                    votingDelegation,
                });
                if (composeRes?.txPlan) {
                    if (composeRes.txPlan.type !== 'error') {
                        setFee(composeRes.txPlan.fee);
                        setDeposit(composeRes.txPlan.deposit);
                    }
                    const actionAvailability = getActionAvailability(composeRes.txPlan);
                    setDelegatingAvailable(actionAvailability);
                    seWithdrawingAvailable(actionAvailability);
                }
            } catch {
                // A TrezorConnect failure is reduced to a fixed reason, never its message, which
                // may embed the composed account payload.
                const actionAvailability: ActionAvailability = {
                    status: false,
                    reason: 'COMPOSE_FAILED',
                };
                setDelegatingAvailable(actionAvailability);
                seWithdrawingAvailable(actionAvailability);
            }

            setLoading(false);
        },
        [account, cardanoPools, votingDelegation],
    );

    // TODO: improve this hook for non-cardano accounts
    if (account?.networkType !== 'cardano') {
        return {
            isStakingDisabled: true,
            deposit: undefined,
            fee: undefined,
            loading: false,
            delegatingAvailable: { status: false },
            withdrawingAvailable: { status: false },
            rewards: '0',
            calculateFeeAndDeposit: () => Promise.resolve(),
        };
    }

    return {
        isStakingDisabled,
        deposit,
        fee,
        loading,
        delegatingAvailable,
        withdrawingAvailable,
        rewards: rewardsAmount,
        calculateFeeAndDeposit,
    };
};
