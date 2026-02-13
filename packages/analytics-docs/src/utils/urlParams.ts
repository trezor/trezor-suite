export const VALID_PLATFORMS = ['all', 'desktop', 'mobile', 'shared'] as const;
export const VALID_SORTS = ['az', 'za', 'added', 'updated'] as const;

export type UrlPlatform = (typeof VALID_PLATFORMS)[number];
export type UrlSort = (typeof VALID_SORTS)[number];

export type UrlParams = {
    query: string;
    platform: UrlPlatform;
    sort: UrlSort;
};

export function getParamsFromUrl(): UrlParams {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

    const platformParam = params.get('platform') as UrlPlatform;
    const sortParam = params.get('sort') as UrlSort;

    return {
        query: params.get('q') ?? '',
        platform: VALID_PLATFORMS.includes(platformParam) ? platformParam : 'all',
        sort: VALID_SORTS.includes(sortParam) ? sortParam : 'az',
    };
}

export function updateUrl(query: string, platform: string, sort: string): void {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (platform !== 'all') params.set('platform', platform);
    if (sort !== 'az') params.set('sort', sort);
    const search = params.toString();
    const url = search ? `${window.location.pathname}?${search}` : window.location.pathname;

    window.history.replaceState(null, '', url);
}
