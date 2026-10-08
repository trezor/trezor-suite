import { getSolanaTokenDefinition } from '@trezor/connect-core/src/api/solana/solanaDefinitions';
import type { EvmTokenDefinitionParams } from '@trezor/network-ethereum-suite-common';

/** Whether Trezor publishes a definition of the EVM token, so the device can name it. */
export const isEvmTokenDefinitionKnown = ({ chainId, contract }: EvmTokenDefinitionParams) =>
    fetch(
        `https://data.trezor.io/firmware/definitions/eth/chain-id/${chainId}/token-${contract
            .substring(2)
            .toLowerCase()}.dat`,
        { method: 'HEAD' },
    )
        .then(response => response.ok)
        .catch(() => false);

/** Whether Trezor publishes a definition of the Solana token (by mint), so the device can name it. */
export const isSolanaTokenDefinitionKnown = async (mint: string) =>
    !!(await getSolanaTokenDefinition({ mintAddress: mint }));
