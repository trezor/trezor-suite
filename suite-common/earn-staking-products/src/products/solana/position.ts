import {
    type GetPositionParams,
    type StakingPosition,
    type StakingPositionDetails,
    type StakingProductDescriptor,
    type StakingProvider,
} from '@suite-common/earn-staking-common';

import {
    getPositionActivations,
    getPositionBalances,
    getPositionOperations,
    getPositionTargets,
    getPositionUnlocks,
    getSolanaStakingPendingTransactions,
    parseSolanaStakeAccounts,
} from './utils';
import { getStakingPositionStatus } from '../../utils/getStakingPositionStatus';

export type GetSolanaProductPositionParams = GetPositionParams & {
    descriptor: StakingProductDescriptor;
    provider: StakingProvider;
    ownsVoteAccount: (voteAccount: string | null) => boolean;
};

export const getSolanaProductPosition = ({
    descriptor,
    provider,
    account,
    productInfo,
    transactions,
    ownsVoteAccount,
}: GetSolanaProductPositionParams): StakingPosition | null => {
    const stakeAccounts = parseSolanaStakeAccounts(account).filter(({ voteAccount }) =>
        ownsVoteAccount(voteAccount),
    );

    if (stakeAccounts.length === 0) {
        return null;
    }

    const rate = productInfo?.rate;
    const epoch = account.misc?.solEpoch ?? null;

    const balances = getPositionBalances({ stakeAccounts, rate, epoch });
    const status = getStakingPositionStatus({ balances });

    const activations = getPositionActivations({ balances });
    const unlocks = getPositionUnlocks({ balances });
    const targets = getPositionTargets({ stakeAccounts, provider });

    const operations = getPositionOperations({
        operations: descriptor.operations,
        balances,
    });

    // Only a product Suite operates on owns the stake operations Suite broadcasts.
    const pendingTransactions =
        descriptor.operations.length === 0
            ? []
            : getSolanaStakingPendingTransactions({ transactions });

    const details: StakingPositionDetails = {
        kind: 'solana-stake-accounts',
        epoch,
        stakeAccounts: stakeAccounts.map(
            ({ status: stakeAccountStatus, stake, rentExemptReserve, activationEpoch }) => ({
                status: stakeAccountStatus,
                stake,
                rentExemptReserve,
                activationEpoch,
            }),
        ),
    };

    return {
        productId: descriptor.id,
        status,
        lockup: 'locked',
        balances,
        activations,
        unlocks,
        targets,
        operations,
        pendingTransactions,
        warnings: [],
        details,
        revalidateAt: null,
    };
};
