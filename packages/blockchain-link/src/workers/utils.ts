import { Solana, SolNetwork } from '@everstake/wallet-sdk';

import { parseHostname } from '@trezor/utils';

import config from './../ui/config';

/**
 * Sorts array of backend urls so the localhost addresses are first,
 * then onion addresses and then the rest. Apart from that it will
 * be shuffled randomly.
 */
export const prioritizeEndpoints = (urls: string[]) =>
    urls
        .map((url): [string, number] => {
            const hostname = parseHostname(url);
            let priority = Math.random();
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                priority += 2;
            } else if (hostname?.endsWith('.onion')) {
                priority += 1;
            }

            return [url, priority];
        })
        .sort(([, a], [, b]) => b - a)
        .map(([url]) => url);

export const getSolanaStakingData = async (descriptor: string, isTestnet: boolean) => {
    const blockchainEnvironment = isTestnet ? 'devnet' : 'mainnet';

    // Find the blockchain configuration for the specified chain and environment
    const blockchainConfig = config.find(c =>
        c.blockchain.name.toLowerCase().includes(`solana ${blockchainEnvironment}`),
    );
    const serverUrl = blockchainConfig?.blockchain.server[0];
    const network = isTestnet ? SolNetwork.Devnet : SolNetwork.Mainnet;

    const solanaClient = new Solana(network, serverUrl);

    const delegations = await solanaClient.getDelegations(descriptor);
    if (!delegations || !delegations.result) {
        throw new Error('Failed to fetch delegations');
    }
    const { result: stakingAccounts } = delegations;

    const epochInfo = await solanaClient.getEpochInfo();
    if (!epochInfo || !epochInfo.result) {
        throw new Error('Failed to fetch epoch info');
    }
    const { epoch } = epochInfo.result;

    return { stakingAccounts, epoch };
};
