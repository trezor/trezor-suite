import type { TokenDetailByMint } from '@trezor/blockchain-link-types';
import { isCodesignBuild } from '@trezor/env-utils';

export const getStellarTokenMetadata = async (): Promise<TokenDetailByMint> => {
    const env = isCodesignBuild() ? 'stable' : 'develop';

    const response = await fetch(
        `https://data.trezor.io/suite/definitions/${env}/stellar.advanced.coin.definitions.v1.json`,
    );

    if (!response.ok) {
        throw Error(`Failed to fetch token metadata: ${response.statusText}`);
    }

    const data: TokenDetailByMint = await response.json();

    return data;
};
