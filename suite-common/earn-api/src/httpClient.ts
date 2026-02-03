import { YIELD_XYZ_BASE_URL } from './config';

type OrvalFetchOptions = RequestInit;

export class OrvalHttpError<T = unknown> extends Error {
    info?: T;
    status?: number;
    response?: Response;

    constructor(message: string, data?: T, status?: number, response?: Response) {
        super(message);
        this.name = 'OrvalHttpError';
        this.info = data;
        this.status = status;
        this.response = response;
    }
}

export const isOrvalHttpError = (error: unknown): error is OrvalHttpError =>
    error instanceof OrvalHttpError;

const isJsonContentType = (contentType: string) =>
    contentType.includes('application/json') || contentType.includes('+json');

const parseBody = async (res: Response): Promise<unknown> => {
    // These statuses must not include a response body per HTTP spec.
    if ([204, 205, 304].includes(res.status)) return null;

    const contentType = (res.headers.get('content-type') ?? '').toLowerCase();

    switch (true) {
        case isJsonContentType(contentType):
            return res.json();
        case contentType.includes('text/'):
            return res.text();
        case contentType.includes('application/x-www-form-urlencoded'): {
            const text = await res.text();

            return new URLSearchParams(text);
        }
        case contentType.includes('multipart/form-data'):
            return res.formData();
        case contentType.includes('application/octet-stream') ||
            contentType.startsWith('image/') ||
            contentType.startsWith('audio/') ||
            contentType.startsWith('video/'):
            return res.blob();
        default:
            return res.text();
    }
};

export const httpClient = async <T>(endpoint: string, init?: OrvalFetchOptions) => {
    const [pathname, search = ''] = endpoint.split('?');
    const url = new URL(YIELD_XYZ_BASE_URL);

    url.search = search;
    url.pathname = `${url.pathname}${pathname}`;

    const req = new Request(url.toString(), init);
    const res = await fetch(req);
    const data = await parseBody(res);

    if (!res.ok) {
        throw new OrvalHttpError('Request failed', data, res.status, res);
    }

    return { data, status: res.status, headers: res.headers } as T;
};
