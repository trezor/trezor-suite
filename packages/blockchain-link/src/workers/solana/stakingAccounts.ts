import { Rpc, RpcMainnet, SolanaRpcApiMainnet, parseBase64RpcAccount } from '@solana/kit';
import {
    STAKE_PROGRAM_ADDRESS,
    StakeStateAccount,
    StakeStateV2,
    decodeStakeStateAccount,
} from '@solana-program/stake';

import { SolanaStakingAccount, StakeState } from '@trezor/blockchain-link-types/src/solana';

export const STAKE_ACCOUNT_V2_SIZE = 200;
export const FILTER_DATA_SIZE = 200n;
export const FILTER_OFFSET = 44n;

const EVERSTAKE_VOTER_PUBKEYS = [
    '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF', // mainnet
    'GkqYQysEGmuL6V2AJoNnWZUz2ZBGWhzQXsJiXm2CLKAN', // devnet
];

export const isStake = (state: StakeStateV2): state is Extract<StakeStateV2, { __kind: 'Stake' }> =>
    state.__kind === 'Stake';

export const stakeAccountState = (account: StakeStateAccount, currentEpoch: bigint): string => {
    const { state } = account;

    if (!isStake(state)) {
        return StakeState.Inactive;
    }

    const { activationEpoch, deactivationEpoch } = state.fields[1].delegation;

    if (activationEpoch > currentEpoch) {
        return StakeState.Inactive;
    }
    if (activationEpoch === currentEpoch) {
        // if you activate then deactivate in the same epoch,
        // deactivationEpoch === activationEpoch.
        // if you deactivate then activate again in the same epoch,
        // the deactivationEpoch will be reset to EPOCH_MAX
        if (deactivationEpoch === activationEpoch) return StakeState.Inactive;

        return StakeState.Activating;
    }
    // activationEpoch < currentEpochBN
    if (deactivationEpoch > currentEpoch) return StakeState.Active;
    if (deactivationEpoch === currentEpoch) return StakeState.Deactivating;

    return StakeState.Deactivated;
};

export const getDelegations = async (
    rpc: RpcMainnet<SolanaRpcApiMainnet> | Rpc<SolanaRpcApiMainnet>,
    descriptor: string,
) => {
    try {
        const accounts = await rpc
            .getProgramAccounts(STAKE_PROGRAM_ADDRESS, {
                encoding: 'base64',
                filters: [
                    {
                        dataSize: FILTER_DATA_SIZE, // Token account size
                    },
                    {
                        memcmp: {
                            bytes: descriptor,
                            encoding: 'base58',
                            offset: FILTER_OFFSET,
                        },
                    },
                ],
            })
            .send();

        return accounts.map(account => {
            const parsedAccount = parseBase64RpcAccount(account.pubkey, account.account);

            return decodeStakeStateAccount(parsedAccount);
        });
    } catch {
        throw new Error('Failed to fetch delegations');
    }
};

export const getSolanaStakingData = async (
    rpc: RpcMainnet<SolanaRpcApiMainnet>,
    descriptor: string,
    epoch: number,
): Promise<SolanaStakingAccount[]> => {
    const stakingAccounts = await getDelegations(rpc, descriptor);

    return stakingAccounts
        .map(account => {
            const stakeAccount = account?.data;
            if (!stakeAccount) return;

            const stakeState = stakeAccountState(stakeAccount, BigInt(epoch));

            const { state } = account?.data ?? {};
            if (!isStake(state)) return;

            if (state && 'fields' in state) {
                const { fields } = state;

                const voterPubkey = fields[1]?.delegation?.voterPubkey;
                if (!EVERSTAKE_VOTER_PUBKEYS.includes(voterPubkey)) return; // filter out non-everstake accounts

                return {
                    rentExemptReserve: fields[0]?.rentExemptReserve.toString(),
                    stake: fields[1]?.delegation?.stake.toString(),
                    status: stakeState,
                };
            }
        })
        .filter(account => account !== undefined);
};
