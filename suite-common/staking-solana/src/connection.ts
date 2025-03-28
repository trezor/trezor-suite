import { createDefaultRpcTransport, createSolanaRpcFromTransport } from '@solana/kit';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { getSuiteVersion } from '@trezor/env-utils';
import { PartialRecord } from '@trezor/type-utils';

import { DEVNET_VALIDATOR_ADDRESS, MAINNET_VALIDATOR_ADDRESS } from './constants';
import { Network, RpcConfig, SolNetworkConfig } from './types';

export const getSolanaValidator = (network: Network = Network.Mainnet) => {
    const networkConfig = {
        [Network.Mainnet]: MAINNET_VALIDATOR_ADDRESS,
        [Network.Devnet]: DEVNET_VALIDATOR_ADDRESS,
    };

    return networkConfig[network];
};

export const getSolanaConnection = (rpcConfig: RpcConfig = {}) => {
    if (!rpcConfig.rpc) throw new Error('RPC URL is required');

    try {
        const transport = createDefaultRpcTransport({
            url: rpcConfig.rpc,
            headers: {
                'User-Agent': rpcConfig.userAgent || '',
            },
        });

        return createSolanaRpcFromTransport(transport);
    } catch {
        throw new Error('Connection failed. Check your RPC URL and try again.');
    }
};

export const getSolNetworkForWalletSdk = (symbol: NetworkSymbol): SolNetworkConfig => {
    const solNetworks: PartialRecord<NetworkSymbol, SolNetworkConfig> = {
        dsol: { network: Network.Devnet },
        sol: { network: Network.Mainnet },
    };

    return solNetworks[symbol] || solNetworks.sol!;
};

export const selectSolanaWalletSdkNetwork = (symbol: NetworkSymbol, url?: string) => {
    const { network } = getSolNetworkForWalletSdk(symbol);

    const connection = getSolanaConnection({
        rpc: url,
        userAgent: `Trezor Suite ${getSuiteVersion()}`,
    });
    const validator = getSolanaValidator(network);

    return {
        connection,
        validator,
    };
};
