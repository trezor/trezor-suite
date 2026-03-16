import { type AllPlatform, type Sort, allPlatforms, sorts } from '../types';

export type UrlParams = {
    query: string;
    platform: AllPlatform;
    sort: Sort;
    sidebarOpen: boolean;
};

export const getParamsFromUrl = (): UrlParams => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

    const platformParam = params.get('platform') as AllPlatform;
    const sortParam = params.get('sort') as Sort;
    const sidebarParam = params.get('sidebar');

    return {
        query: params.get('q') ?? '',
        platform: allPlatforms.includes(platformParam) ? platformParam : 'all',
        sort: sorts.includes(sortParam) ? sortParam : 'az',
        sidebarOpen: sidebarParam === 'true',
    };
};

export const updateUrl = (
    query: string,
    platform: string,
    sort: string,
    sidebarOpen?: boolean,
): void => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (platform !== 'all') params.set('platform', platform);
    if (sort !== 'az') params.set('sort', sort);
    if (sidebarOpen === true) params.set('sidebar', 'true');
    const search = params.toString();
    const url = search ? `${window.location.pathname}?${search}` : window.location.pathname;

    const { hash } = window.location;

    window.history.replaceState(null, '', `${url}${hash}`);
};
