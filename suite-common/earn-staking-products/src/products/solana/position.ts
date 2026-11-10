import {
    type GetPositionParams,
    type StakingPosition,
    type StakingPositionDetails,
    type StakingProductDescriptor,
    type StakingProvider,
} from '@suite-common/earn-staking-common';

import {
    getSolanaDelegationPendingTransactions,
    getSolanaDelegationPositionBalances,
    getSolanaDelegationPositionOperations,
    getSolanaDelegationPositionTargets,
    getSolanaDelegationPositionUnlocks,
    parseSolanaStakeAccounts,
} from './utils';
import { getStakingPositionStatus } from '../../utils/getStakingPositionStatus';

export type GetSolanaDelegationProductPositionParams = GetPositionParams & {
    descriptor: StakingProductDescriptor;
    provider: StakingProvider;
    ownsVoteAccount: (voteAccount: string | null) => boolean;
};

export const getSolanaDelegationProductPosition = ({
    descriptor,
    provider,
    account,
    productInfo,
    transactions,
    ownsVoteAccount,
}: GetSolanaDelegationProductPositionParams): StakingPosition | null => {
    const stakeAccounts = parseSolanaStakeAccounts(account).filter(({ voteAccount }) =>
        ownsVoteAccount(voteAccount),
    );

    if (stakeAccounts.length === 0) {
        return null;
    }

    const rate = productInfo?.rate;
    const epoch = account.misc?.solEpoch ?? null;

    const balances = getSolanaDelegationPositionBalances({ stakeAccounts, rate, epoch });
    const status = getStakingPositionStatus({ balances });

    const unlocks = getSolanaDelegationPositionUnlocks({ balances });
    const targets = getSolanaDelegationPositionTargets({ stakeAccounts, provider });

    const operations = getSolanaDelegationPositionOperations({
        operations: descriptor.operations,
        balances,
    });

    // Only a product Suite operates on owns the stake operations Suite broadcasts.
    const pendingTransactions =
        descriptor.operations.length === 0
            ? []
            : getSolanaDelegationPendingTransactions({ transactions });

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
        unlocks,
        targets,
        operations,
        pendingTransactions,
        warnings: [],
        details,
        revalidateAt: null,
    };
};
