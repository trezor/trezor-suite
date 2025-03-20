import { Network, Solana, isStake, stakeAccountState } from '@everstake/wallet-sdk-solana';

import { SolanaStakingAccount } from '@trezor/blockchain-link-types/src/solana';
import { getSuiteVersion } from '@trezor/env-utils';

const EVERSTAKE_VOTER_PUBKEYS = [
    '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF', // mainnet
    'GkqYQysEGmuL6V2AJoNnWZUz2ZBGWhzQXsJiXm2CLKAN', // devnet
];

export const getSolanaStakingData = async (
    descriptor: string,
    isTestnet: boolean,
    epoch: number,
    serverUrl: string,
): Promise<SolanaStakingAccount[]> => {
    console.log('getSolanaStakingData', descriptor, isTestnet, epoch, serverUrl);
    const network = isTestnet ? Network.Devnet : Network.Mainnet;

    const solanaClient = new Solana(network, {
        rpc: serverUrl,
        userAgent: `Trezor Suite ${getSuiteVersion()}`,
    });

    const delegations = await solanaClient.getDelegations(descriptor);
    if (!delegations || !delegations.result) {
        throw new Error('Failed to fetch delegations');
    }
    const { result: stakingAccounts } = delegations;
    console.log('stakingAccounts', stakingAccounts);

    return stakingAccounts
        .map(account => {
            const stakeAccount = account?.data;
            if (!stakeAccount) return;

            const stakeState = stakeAccountState(stakeAccount, BigInt(epoch));
            console.log('stakeState', stakeAccount, stakeState);

            const { state } = account?.data ?? {};
            if (!isStake(state)) return;

            if (state && 'fields' in state) {
                const { fields } = state;

                const voterPubkey = fields[1]?.delegation?.voterPubkey;
                console.log('voterPubkey', voterPubkey);
                if (!EVERSTAKE_VOTER_PUBKEYS.includes(voterPubkey)) return; // filter out non-everstake accounts

                return {
                    rentExemptReserve: fields[0]?.rentExemptReserve.toString(),
                    stake: fields[1]?.delegation?.stake.toString(),
                    status: stakeState,
                };
            } else {
                console.log('problem');
            }
        })
        .filter(account => account !== undefined);
};
