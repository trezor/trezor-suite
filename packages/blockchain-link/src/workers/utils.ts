import { Solana, SolNetwork } from '@everstake/wallet-sdk';

import { parseHostname } from '@trezor/utils';

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

export const getSolanaStakingAccounts = async (descriptor: string, isTestnet: boolean) => {
    const networkConfig = {
        devnet: {
            network: SolNetwork.Devnet,
            url: 'https://solana-dev.trezor.io/',
        },
        mainnet: {
            network: SolNetwork.Mainnet,
            url: 'https://solana1.trezor.io/',
        },
    };

    const selectedConfig = isTestnet ? networkConfig.devnet : networkConfig.mainnet;

    const solanaClient = new Solana(selectedConfig.network, selectedConfig.url);

    const delegations = await solanaClient.getDelegations(descriptor);
    const { result: stakingAccounts } = delegations;

    return stakingAccounts;
};
