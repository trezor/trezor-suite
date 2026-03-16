import { getSuiteVersion } from '@trezor/env-utils';
import { type Result, err, ok } from '@trezor/type-utils';
import { typedObjectEntries } from '@trezor/utils';

import { DEFAULT_QUOTA_MANAGER_URL } from './constants';

type SupportedMethod = 'GET' | 'POST' | 'DELETE';

// explicit list of supported endpoints and their methods
type SupportedPath = '/challenge' | '/storage/ask' | '/storage/register' | '/storage/add' | '/sync';

type QuotaManagerFetchParams = {
    baseUrl: string | null;
    path: SupportedPath;
    method: SupportedMethod;
    body?: unknown;
    queryParams?: Record<string, string | number | boolean>;
};

type HttpError = {
    type: 'HttpError';
    code: number;
    message: string;
};

type FetchError = {
    type: 'FetchError';
    message: string;
};

type QuotaManagerFetchResult = Result<unknown, HttpError | FetchError>;

export const quotaManagerFetch = async ({
    baseUrl,
    path,
    method,
    body,
    queryParams,
}: QuotaManagerFetchParams): Promise<QuotaManagerFetchResult> => {
    const base = baseUrl ?? DEFAULT_QUOTA_MANAGER_URL;

    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    const normalizedPath = path.replace(/^\/+/, '');

    const url = new URL(normalizedPath, normalizedBase);

    if (queryParams !== undefined) {
        typedObjectEntries(queryParams).forEach(([key, value]) => {
            url.searchParams.append(key, value.toString());
        });
    }

    try {
        const response = await fetch(url.toString(), {
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
