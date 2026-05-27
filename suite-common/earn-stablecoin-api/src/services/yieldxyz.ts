import {
    YIELD_XYZ_BASE_URL,
    enterYieldResponse,
    exitYieldResponse,
    getYieldsResponse,
} from '@suite-common/earn-stablecoin-defs';
import { createHttpClient } from '@suite-common/http-client';
import { getSuiteVersion } from '@trezor/env-utils';

export const yieldXyzApi = createHttpClient({
    baseUrl: YIELD_XYZ_BASE_URL,
    headers: { 'X-Suite-Version': getSuiteVersion() },
});

export const getYields = yieldXyzApi('/yields', {
    method: 'GET',
    schema: getYieldsResponse,
});

export const enterYield = yieldXyzApi('/actions/enter', {
    method: 'POST',
    schema: enterYieldResponse,
});

export const exitYield = yieldXyzApi('/actions/exit', {
    method: 'POST',
    schema: exitYieldResponse,
});
