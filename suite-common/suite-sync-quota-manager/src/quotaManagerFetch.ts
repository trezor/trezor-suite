import { getSuiteVersion } from '@trezor/env-utils';
import { type Result, err, ok } from '@trezor/type-utils';
import { typedObjectEntries } from '@trezor/utils';

import { DEFAULT_QUOTA_MANAGER_URL } from './constants';

type SupportedMethod = 'GET' | 'POST' | 'DELETE';

// explicit list of supported endpoints and their methods
type SupportedPath = '/challenge' | '/storage/ask' | '/storage/register' | '/storage/add' | '/sync';

export type QuotaManagerHttpError = {
    type: 'HttpError';
    code: number;
    message: string;
};

export type QuotaManagerFetchError = {
    type: 'FetchError';
    message: string;
};

export type QuotaManagerFetchCommunicationError = QuotaManagerHttpError | QuotaManagerFetchError;

export type QuotaManagerFetchResult = Result<unknown, QuotaManagerFetchCommunicationError>;

export type QuotaManagerFetchParams = {
    path: SupportedPath;
    method: SupportedMethod;
    body?: unknown;
    queryParams?: Record<string, string | number | boolean>;
};

export type QuotaManagerFetch = (
    params: QuotaManagerFetchParams,
) => Promise<QuotaManagerFetchResult>;

export type QuotaManagerFetchDep = {
    quotaManagerFetch: QuotaManagerFetch;
};

export type FetchDep = {
    fetch: typeof fetch;
};

type GetQuotaManagerBaseUrl = () => string | null;

export type CreateQuotaManagerFetchDeps = {
    getQuotaManagerBaseUrl: GetQuotaManagerBaseUrl;
} & FetchDep;

export const createQuotaManagerFetch =
    (deps: CreateQuotaManagerFetchDeps): QuotaManagerFetch =>
    async ({ path, method, body, queryParams }) => {
        const base = deps.getQuotaManagerBaseUrl() ?? DEFAULT_QUOTA_MANAGER_URL;

        const normalizedBase = base.endsWith('/') ? base : `${base}/`;
        const normalizedPath = path.replace(/^\/+/, '');

        try {
            const url = new URL(normalizedPath, normalizedBase); // can fail for invalid URL, needs to be in try-catch

            if (queryParams !== undefined) {
                typedObjectEntries(queryParams).forEach(([key, value]) => {
                    url.searchParams.append(key, value.toString());
                });
            }

            const response = await deps.fetch(url.toString(), {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Suite-Version': getSuiteVersion(),
                },
                body: body ? JSON.stringify(body) : null,
            });

            if (!response.ok) {
                return err({
                    type: 'HttpError' as const,
                    code: response.status,
                    message: response.statusText,
                });
            }

            const data = (await response.json()) as unknown;

            return ok(data);
        } catch (e) {
            return err({
                type: 'FetchError' as const,
                message: e.message,
            });
        }
    };
