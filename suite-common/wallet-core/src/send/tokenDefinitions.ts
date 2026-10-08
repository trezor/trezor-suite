import { getEthereumDefinitionsBaseUrl } from '@trezor/connect-common';
import { getSolanaTokenDefinition } from '@trezor/connect-core/src/api/solana/solanaDefinitions';
import type { EvmTokenDefinitionParams } from '@trezor/network-ethereum-suite-common';

/**
 * Whether Trezor publishes a definition of the EVM token, so the device can name it. The base URL
 * is where Connect takes the definitions it sends to the device from; it is read only when a token
 * is checked.
 */
export const createIsEvmTokenDefinitionKnown =
    (getBaseUrl: () => string) =>
    ({ chainId, contract }: EvmTokenDefinitionParams) =>
        fetch(
            `${getBaseUrl()}/chain-id/${chainId}/token-${contract.substring(2).toLowerCase()}.dat`,
            { method: 'HEAD' },
        )
            .then(response => response.ok)
            .catch(() => false);

/** Whether Trezor publishes a definition of the EVM token in the production channel. */
export const isEvmTokenDefinitionKnown = createIsEvmTokenDefinitionKnown(() =>
    getEthereumDefinitionsBaseUrl(1),
);

/** Whether Trezor publishes a definition of the Solana token (by mint), so the device can name it. */
export const isSolanaTokenDefinitionKnown = async (mint: string) =>
    !!(await getSolanaTokenDefinition({ mintAddress: mint }));
