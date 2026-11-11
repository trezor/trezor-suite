import {
    type GetPositionParams,
    type StakingAccount,
    type StakingPosition,
    type StakingPositionDetails,
    type StakingPositionPendingTransaction,
    type StakingPositionWarning,
    type StakingProductDescriptor,
    type StakingProvider,
} from '@suite-common/earn-staking-common';
import { BigNumber } from '@trezor/utils';

import {
    getCardanoStakingPendingTransactions,
    getParsedCardanoAccountBalance,
    getParsedCardanoStakingInfo,
    getPositionBalances,
    getPositionOperations,
    getPositionTargets,
    isCardanoStakeKeyRegistered,
} from './utils';
import { getStakingPositionStatus } from '../../utils/getStakingPositionStatus';
import {
    ZERO_STAKING_AMOUNT,
    isPositiveStakingAmount,
    toStakingAmount,
} from '../../utils/stakingAmounts';

type GetPendingFirstStakePositionParams = {
    descriptor: StakingProductDescriptor;
    account: StakingAccount;
    pendingTransactions: readonly StakingPositionPendingTransaction[];
};

// Suite stakes with Everstake only, so a stake key whose registration is still pending belongs to
// the Everstake product, with the balance waiting to be delegated.
const getPendingFirstStakePosition = ({
    descriptor,
    account,
    pendingTransactions,
}: GetPendingFirstStakePositionParams): StakingPosition | null => {
    const balance = getParsedCardanoAccountBalance(account);

    if (balance === null || !pendingTransactions.some(({ operation }) => operation === 'stake')) {
        return null;
    }

    return {
        productId: descriptor.id,
        status: 'activating',
        lockup: 'liquid',
        balances: {
            staked: ZERO_STAKING_AMOUNT,
            pending: balance,
            unstaking: ZERO_STAKING_AMOUNT,
            withdrawable: ZERO_STAKING_AMOUNT,
            rewards: ZERO_STAKING_AMOUNT,
        },
        unlocks: [],
        targets: [],
        operations: [],
        pendingTransactions,
        warnings: [],
        details: { kind: 'cardano-delegation', poolId: null, drep: null },
        revalidateAt: null,
    };
};

export type GetCardanoProductPositionParams = GetPositionParams & {
    descriptor: StakingProductDescriptor;
    provider: StakingProvider;
    ownsPool: (poolId: string | null) => boolean;
    ownsPendingFirstStake: boolean;
};

export const getCardanoProductPosition = ({
    descriptor,
    provider,
    account,
    transactions,
    ownsPool,
    ownsPendingFirstStake,
}: GetCardanoProductPositionParams): StakingPosition | null => {
    const pendingTransactions = getCardanoStakingPendingTransactions({ transactions });

    if (!isCardanoStakeKeyRegistered(account)) {
        if (!ownsPendingFirstStake) {
            return null;
        }

        return getPendingFirstStakePosition({ descriptor, account, pendingTransactions });
    }

    const stakingInfo = getParsedCardanoStakingInfo({ account });

    if (stakingInfo === null || !ownsPool(stakingInfo.poolId)) {
        return null;
    }

    const { balance, poolId, rewards, drep } = stakingInfo;
    // The account balance already holds the reward balance, so the two must not overlap.
    const staked = toStakingAmount(BigNumber.max(new BigNumber(balance).minus(rewards), 0));
    const isWithdrawalBlocked = isPositiveStakingAmount(rewards) && drep === null;

    const balances = getPositionBalances({ staked, rewards });
    const status = getStakingPositionStatus({ balances });

    const operations = getPositionOperations({
        operations: descriptor.operations,
        rewards,
        isWithdrawalBlocked,
        pendingTransactions,
    });

    const targets = getPositionTargets({ poolId, staked, provider });

    const warnings: StakingPositionWarning[] = [
        ...(provider.status === 'retired'
            ? [{ code: 'outdated-provider' as const, providerId: provider.id }]
            : []),
        ...(isWithdrawalBlocked ? [{ code: 'missing-drep' as const }] : []),
    ];

    const details: StakingPositionDetails = { kind: 'cardano-delegation', poolId, drep };

    return {
        productId: descriptor.id,
        status,
        lockup: 'liquid',
        balances,
        unlocks: [],
        targets,
        operations,
        pendingTransactions,
        warnings,
        details,
        revalidateAt: null,
    };
};
