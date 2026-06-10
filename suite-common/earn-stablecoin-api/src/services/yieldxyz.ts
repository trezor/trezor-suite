import { getYieldResponse, getYieldsResponse } from '@suite-common/earn-stablecoin-defs';
import { createHttpClient } from '@suite-common/http-client';
import { getSuiteVersion } from '@trezor/env-utils';

import { earnYieldWorkerBaseUrl } from '../context';

export const yieldXyzApi = createHttpClient({
    async baseUrl() {
        const baseUrl = await earnYieldWorkerBaseUrl.get();

        return `${baseUrl}/yieldxyz/v1`;
    },
    headers: { 'X-Suite-Version': getSuiteVersion() },
});

export const getYields = yieldXyzApi('/yields', {
    method: 'GET',
    schema: getYieldsResponse,
});

export const getYield = yieldXyzApi('/yields/:vaultId', {
    method: 'GET',
    schema: getYieldResponse,
});
