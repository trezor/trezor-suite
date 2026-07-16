import type z from 'zod';

import {
    type GetYieldsV2QueryParams,
    YieldResponseV2,
    type YieldResponseV2Output,
    YieldsResponseV2,
    type YieldsResponseV2Output,
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

type YieldXyzRequestOptions = {
    signal?: AbortSignal;
};

type GetYieldsOptions = YieldXyzRequestOptions & {
    params?: z.input<typeof GetYieldsV2QueryParams>;
};

type GetYieldOptions = YieldXyzRequestOptions & {
    routeParams: { vaultId: string };
};

/** Prevents declaration emit from expanding the inferred Yield.xyz list schema. */
export const getYields: (options?: GetYieldsOptions) => Promise<YieldsResponseV2Output> =
    yieldXyzApi('/yields', {
        method: 'GET',
        schema: YieldsResponseV2,
    });

/** Prevents declaration emit from expanding the inferred Yield.xyz detail schema. */
export const getYield: (options: GetYieldOptions) => Promise<YieldResponseV2Output> = yieldXyzApi(
    '/yields/:vaultId',
    {
        method: 'GET',
        schema: YieldResponseV2,
    },
);
