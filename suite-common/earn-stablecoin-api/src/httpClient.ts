import {
    createHttpClient,
    parseResponseBody,
    requestInitToFetcherOptions,
} from '@suite-common/http-client';

import { YIELD_XYZ_BASE_URL } from './config';

const yieldXyzHttpClient = createHttpClient({
    baseUrl: YIELD_XYZ_BASE_URL,
});

export const httpClient = async <T>(endpoint: string, init?: RequestInit): Promise<T> => {
    const fetcher = yieldXyzHttpClient(endpoint, {
        ...requestInitToFetcherOptions(init),
        async parseResponse(response) {
            const data = await parseResponseBody(response);

            return {
                data,
                status: response.status,
                headers: response.headers,
            };
        },
    });

    const result = await fetcher(requestInitToFetcherOptions(init));

    return result as T;
};
