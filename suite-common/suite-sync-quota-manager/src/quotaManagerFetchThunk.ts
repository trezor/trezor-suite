import { err, ok } from '@trezor/type-utils';

type SupportedMethod = 'GET' | 'POST' | 'DELETE';

// explicitly list supported endpoints and their methods
type SupportedPath = '/challenge' | '/storage/ask' | '/storage/register' | '/storage/add' | '/sync';

type QuotaManagerFetchParams = {
    baseUrl: string;
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
    const url = new URL(path, baseUrl);

    if (queryParams) {
        Object.entries(queryParams).forEach(([key, value]) => {
            url.searchParams.append(key, String(value));
        });
    }

    const response = await fetch(url.toString(), {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : null,
    });

    if (!response.ok) {
        // TODO - improve error handling, parse error response from QM API
        return err(response.statusText);
    }

    const data = (await response.json()) as unknown;

    return ok(data);
};
