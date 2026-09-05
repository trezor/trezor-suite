import { useCallback, useState } from 'react';

import { selectSelectedAccount } from '@suite/account';
import {
    hasPendingStakeTypeTransaction,
    selectCardanoPoolsInfo,
    selectStakeVotingDelegation,
} from '@suite-common/wallet-core';
import {
    type ActionAvailability,
    type CardanoAction,
    type CardanoStaking,
} from '@suite-common/wallet-types';

import {
    CardanoComposeError,
    prepareTxPlan,
} from 'src/actions/wallet/stake/stakeFormCardanoActions';
import { useSelector } from 'src/hooks/suite';

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

            setLoading(true);
            try {
                const composeRes = await prepareTxPlan({
                    account,
                    action,
                    cardanoPools,
                    votingDelegation,
                });
                if (composeRes?.txPlan) {
                    if (composeRes.txPlan.type === 'error') {
                        throw new Error(composeRes.txPlan.error);
                    }
                    setFee(composeRes.txPlan.fee);
                    setDeposit(composeRes.txPlan.deposit);
                    const actionAvailability: ActionAvailability =
                        composeRes.txPlan.type === 'final'
                            ? {
                                  status: true,
                              }
                            : {
                                  status: false,
                                  reason: 'TX_NOT_FINAL',
                              };
                    setDelegatingAvailable(actionAvailability);
                    seWithdrawingAvailable(actionAvailability);
                }
            } catch (err) {
                // todo:  noted that this err appears regularly. error becomes undefined
                // which effectively removes any previously set errors
                // Deserialization failed in Ed25519KeyHash because: Invalid cbor: expected tuple 'hash length' of length 28 but got length Len(0).
                const actionAvailability: ActionAvailability = {
                    status: false,
                    // A TrezorConnect failure is kept as its code only, never as its message, which
                    // may embed the composed account payload.
                    reason: err instanceof CardanoComposeError ? err.code : err.message,
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
