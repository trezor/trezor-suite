import {
    type SolanaStakeAccount,
    type StakingAccount,
    solanaStakeAccountStatusSchema,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';

export type ParsedSolanaStakeAccount = SolanaStakeAccount & {
    voteAccount: string | null;
};

// Blockchain-link splits the stake accounts by the Everstake vote accounts; products regroup both
// lists by their own providers. An entry with an unknown status or stake is left out so the rest
// of the account still syncs.
export const parseSolanaStakeAccounts = (
    account: StakingAccount,
): readonly ParsedSolanaStakeAccount[] =>
    [
        ...(account.misc?.solStakingAccounts ?? []),
        ...(account.misc?.solExternalStakingAccounts ?? []),
    ].flatMap(({ status, stake, voterPubkey, activationEpoch }) => {
        const parsedStatus = solanaStakeAccountStatusSchema.safeParse(status);
        const parsedStake = stakingAmountSchema.safeParse(stake ?? '0');

        if (!parsedStatus.success || !parsedStake.success) return [];

        return [
            {
                status: parsedStatus.data,
                stake: parsedStake.data,
                voteAccount: voterPubkey ?? null,
                activationEpoch: activationEpoch ?? null,
            },
        ];
    });
