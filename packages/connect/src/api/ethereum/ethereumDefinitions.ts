import fetch from 'cross-fetch';

import { EthereumDefinitions } from '@trezor/protobuf/lib/messages';

/**
 * For given chainId and optionally contractAddress download ethereum definitions for transaction signing.
 * Definitions are only required to display correct information on display. If definitions
 * are not provided UNKNOWN is shown. This means that should this method fail we only log this but don't return error.
 */
export const getEthereumDefinitions = async ({
    chainId,
    slip44,
    contractAddress,
}: {
    chainId: number | undefined;
    slip44?: number;
    contractAddress?: string;
}) => {
    const definitions: EthereumDefinitions = {};

    if (!chainId && !slip44) {
        throw new Error('argument chainId or slip44 is required');
    }

    try {
        const networkDefinitionUrl = `https://data.trezor.io/firmware/eth-definitions/${
            chainId ? 'chain-id' : 'slip44'
        }/${chainId ?? slip44}/network.dat`;
        const networkDefinition = await fetch(networkDefinitionUrl);
        if (networkDefinition.status === 200) {
            definitions.encoded_network = await networkDefinition.arrayBuffer();
        } else if (networkDefinition.status !== 404) {
            throw new Error(`unexpected status: $${networkDefinition.status}`);
        }
    } catch (err) {
        console.warn(`unable to download or parse ${chainId} definition. detail: ${err.message}`);
    }

    try {
        if (contractAddress) {
            // Contract address has to be in lowercase in order to be found in eth-definitions.
            const lowerCaseContractAddress = contractAddress.toLowerCase();
            const tokenDefinitionUrl = `https://data.trezor.io/firmware/eth-definitions/${
                chainId ? 'chain-id' : 'slip44'
            }/${chainId ?? slip44}/token-${lowerCaseContractAddress}.dat`;
            const tokenDefinition = await fetch(tokenDefinitionUrl);
            if (tokenDefinition.status === 200) {
                definitions.encoded_token = await tokenDefinition.arrayBuffer();
            } else if (tokenDefinition.status !== 404) {
                throw new Error(`unexpected status: $${tokenDefinition.status}`);
            }
        }
    } catch (err) {
        console.warn(
            `unable to download or parse ${chainId}/${contractAddress} definition. detail: ${err.message}`,
        );
    }

    return definitions;
};
