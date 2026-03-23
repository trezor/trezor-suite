export const httpRequest = async (url: string, type = 'text'): Promise<any> => {
    const response: Response = await fetch(url, { credentials: 'same-origin' });
    if (response.ok) {
        if (type === 'json') {
            const txt = await response.text();

            return JSON.parse(txt);
        }
        if (type === 'binary') {
            return response.arrayBuffer();
        }

        return response.text();
    }
    throw new Error(`${url} ${response.statusText}`);
};

interface RequestUrlParams<
    Base extends string,
    Pathname extends string,
    SearchParams extends Record<string, string>,
> {
    base: Base;
    pathname?: Pathname;
    searchParams?: SearchParams;
}

export function requestUrl<
    const Base extends string,
    const Pathname extends string,
    SearchParams extends Record<string, string>,
>({
    base,
    pathname,
    searchParams,
}: RequestUrlParams<
    Base,
    Pathname,
    SearchParams
>): `${Base}${Pathname extends string ? `/${Pathname}` : ``}` {
    const url = new URL(base);

    if (pathname) {
        url.pathname = `${url.pathname}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
    }

    if (searchParams) {
        url.search = new URLSearchParams(searchParams).toString();
    }

    return url.toString() as `${Base}${Pathname extends string ? `/${Pathname}` : ``}`;
}
