import { AllPlatform, Sort, allPlatforms, sorts } from '../types';

export type UrlParams = {
    query: string;
    platform: AllPlatform;
    sort: Sort;
};

export const getParamsFromUrl = (): UrlParams => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

    const platformParam = params.get('platform') as AllPlatform;
    const sortParam = params.get('sort') as Sort;

    return {
        query: params.get('q') ?? '',
        platform: allPlatforms.includes(platformParam) ? platformParam : 'all',
        sort: sorts.includes(sortParam) ? sortParam : 'az',
    };
};

export const updateUrl = (query: string, platform: string, sort: string): void => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (platform !== 'all') params.set('platform', platform);
    if (sort !== 'az') params.set('sort', sort);
    const search = params.toString();
    const url = search ? `${window.location.pathname}?${search}` : window.location.pathname;

    window.history.replaceState(null, '', url);
};
