import {
    GetYieldV2Params,
    GetYieldsV2QueryParams,
    YieldResponseV2,
    YieldsResponseV2,
} from '@suite-common/earn-stablecoin-defs';
import { createHttpClient } from '@suite-common/http-client';
import { getSuiteVersion } from '@trezor/env-utils';

import { earnYieldWorkerBaseUrl } from '../context';

const yieldXyzApi = createHttpClient({
    async baseUrl() {
        const baseUrl = await earnYieldWorkerBaseUrl.get();

        return `${baseUrl}/yieldxyz/v2`;
    },
    headers: { 'X-Suite-Version': getSuiteVersion() },
});

export const getYields = yieldXyzApi('/yields', {
    method: 'GET',
    schema: YieldsResponseV2,
    requestSchemas: {
        params: GetYieldsV2QueryParams,
    },
});

export const getYield = yieldXyzApi('/yields/:yieldId', {
    method: 'GET',
    schema: YieldResponseV2,
    requestSchemas: {
        routeParams: GetYieldV2Params,
    },
});
