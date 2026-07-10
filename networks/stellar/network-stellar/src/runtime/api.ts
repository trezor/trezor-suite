import { Horizon, Networks } from '@stellar/stellar-sdk';

export const getStellarConnection = async (url: string, userAgent?: string) => {
    const api = new Horizon.Server(url, {
        headers: userAgent ? { 'User-Agent': userAgent } : {},
    });

    const isTestnet = await api.root().then(res => res.network_passphrase === Networks.TESTNET);

    return { api, isTestnet };
};
