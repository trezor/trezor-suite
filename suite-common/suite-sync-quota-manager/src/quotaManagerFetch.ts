import { getSuiteVersion } from '@trezor/env-utils';
import { err, ok } from '@trezor/type-utils';
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

export const quotaManagerFetch = async ({
    baseUrl,
    path,
    method,
    body,
    queryParams,
}: QuotaManagerFetchParams) => {
    const url = new URL(path, baseUrl ?? DEFAULT_QUOTA_MANAGER_URL);

    if (queryParams !== undefined) {
        typedObjectEntries(queryParams).forEach(([key, value]) => {
            url.searchParams.append(key, value.toString());
        });
    }

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
            code: response.status,
            message: response.statusText,
        });
    }

    const data = (await response.json()) as unknown;

    return ok(data);
};
