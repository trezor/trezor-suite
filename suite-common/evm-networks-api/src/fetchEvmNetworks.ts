import { isCodesignBuild } from '@trezor/env-utils';

import {
    EVM_NETWORKS_PATH,
    type EvmNetworksResponse,
    parseEvmNetworksResponse,
} from './evmNetworksContract';

// TODO: Placeholder hosts until the service is deployed.
const EVM_NETWORKS_PRODUCTION_BASE_URL = 'https://evm-networks.trezor.io';
const EVM_NETWORKS_DEVELOPMENT_BASE_URL = 'https://evm-networks.sldev.cz';

export const getEvmNetworksUrl = () =>
    `${isCodesignBuild() ? EVM_NETWORKS_PRODUCTION_BASE_URL : EVM_NETWORKS_DEVELOPMENT_BASE_URL}${EVM_NETWORKS_PATH}`;

type FetchEvmNetworksParams = {
    signal?: AbortSignal;
};

export const fetchEvmNetworks = async ({
    signal,
}: FetchEvmNetworksParams = {}): Promise<EvmNetworksResponse> => {
    // The same privacy defaults as `@suite-common/http-client`: no cookies, no Referer.
    const response = await fetch(getEvmNetworksUrl(), {
        signal,
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch EVM networks: ${response.status}`);
    }

    const result = parseEvmNetworksResponse(await response.json());

    if (!result.success) {
        throw new Error(`Invalid EVM networks: ${result.error.detail}`);
    }

    return result.payload;
};
