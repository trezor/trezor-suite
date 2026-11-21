import { useCallback, useState } from 'react';

import {
    selectStakeableStakingProductDescriptorBySymbol,
    selectStakingAccountPositionEntry,
    selectStakingAccountTotals,
    useStakingProductTargets,
} from '@suite-common/earn-staking';
import { hasPendingStakingOperation } from '@suite-common/earn-staking-common';
import {
    isCardanoWithdrawalBlockedByMissingDrep,
    selectCardanoProtocolParameters,
    selectStakeVotingDelegation,
} from '@suite-common/wallet-core';
import {
    type Account,
    type ActionAvailability,
    type ActionUnavailableReason,
    type CardanoAction,
    type CardanoStaking,
} from '@suite-common/wallet-types';
import { type PrecomposedTransactionCardano } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';
import { isArrayMember } from '@trezor/utils';

import {
    getCardanoPoolsFromTargets,
    prepareTxPlan,
} from '#src/actions/wallet/stake/stakeFormCardanoActions';
import { useSelector } from '#src/hooks/suite/useSelector';

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

type UseCardanoStakingParams = {
    account: Account;
};

export const useCardanoStaking = ({ account }: UseCardanoStakingParams): CardanoStaking => {
    const isCardano = account.networkType === 'cardano';

    // A delegation goes to the product the network stakes on; its cached targets are the pools.
    const stakeableProductId = useSelector(
        state => selectStakeableStakingProductDescriptorBySymbol(state, account.symbol)?.id ?? null,
    );
    const cardanoPools = getCardanoPoolsFromTargets(useStakingProductTargets(stakeableProductId));
    const votingDelegation = useSelector(selectStakeVotingDelegation);
    const protocolParameters = useSelector(state =>
        selectCardanoProtocolParameters(state, account.symbol),
    );
    const hasPendingTx = useSelector(state => {
        const positionEntry = selectStakingAccountPositionEntry(state, account.key);

        return positionEntry !== null && hasPendingStakingOperation(positionEntry.position);
    });
    // The reward balance Blockfrost reports, in lovelace, which the withdrawal composes with.
    const rewards = useSelector(state => selectStakingAccountTotals(state, account.key).rewards);

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

    const isStakingDisabled =
        (account.availableBalance === '0' || !delegatingAvailable.status || hasPendingTx) &&
        !loading;

    const calculateFeeAndDeposit = useCallback(
        async (action: CardanoAction) => {
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
                    protocolParameters,
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
        [account, cardanoPools, votingDelegation, protocolParameters],
    );

    // TODO: improve this hook for non-cardano accounts
    if (!isCardano) {
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
        rewards,
        calculateFeeAndDeposit,
    };
};
