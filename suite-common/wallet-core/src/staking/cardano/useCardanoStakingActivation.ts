import { useSelector } from 'react-redux';

import { CARDANO_ACTIVATION_PERIOD_MAX_DAYS } from '@suite-common/wallet-constants';
import { type Account } from '@suite-common/wallet-types';
import { isPending, isPositiveBalance } from '@suite-common/wallet-utils';
import { useNow } from '@trezor/react-utils';
import { createWeakMapSelector } from '@trezor/redux-utils';

import { type TransactionsRootState } from '../../transactions/transactionsReducerTypes';
import { selectAccountTransactions } from '../../transactions/transactionsSelectors';
import { getTxStakeType } from '../shared/stakingUtils';

const MAX_ACTIVATION_PERIOD_MS = CARDANO_ACTIVATION_PERIOD_MAX_DAYS * 24 * 60 * 60_000;
const ACTIVATION_REFRESH_INTERVAL_MS = 60_000;

const selectLastConfirmedCardanoStakingTx = createWeakMapSelector(
    [selectAccountTransactions],
    transactions =>
        transactions.find(tx => {
            const subtype = tx.cardanoSpecific?.subtype;

            return subtype !== undefined && subtype !== 'governance_delegation' && !isPending(tx);
        }),
);

type UseCardanoStakingActivationParams = {
    account: Pick<Account, 'key' | 'networkType'>;
    rewards: string;
};

export const useCardanoStakingActivation = ({
    account,
    rewards,
}: UseCardanoStakingActivationParams) => {
    const lastStakeTx = useSelector((state: TransactionsRootState) =>
        account.networkType === 'cardano'
            ? selectLastConfirmedCardanoStakingTx(state, account.key)
            : undefined,
    );
    const lastConfirmedStakeType = lastStakeTx ? getTxStakeType(lastStakeTx) : undefined;

    // Claiming can empty the rewards on an established stake. Use the confirmation time of the
    // pool delegation to bound the activation estimate.
    const delegationBlockTime = lastConfirmedStakeType === 'stake' ? lastStakeTx?.blockTime : null;
    const activationEndsAt = delegationBlockTime
        ? delegationBlockTime * 1000 + MAX_ACTIVATION_PERIOD_MS
        : null;
    const isWaitingForRewards = activationEndsAt !== null && !isPositiveBalance(rewards);
    const now = useNow(isWaitingForRewards ? ACTIVATION_REFRESH_INTERVAL_MS : null);

    return { isActivating: isWaitingForRewards && now < activationEndsAt, lastConfirmedStakeType };
};
