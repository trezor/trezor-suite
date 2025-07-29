import { isArrayMember } from '@trezor/utils';

export const dashboardBannerTypes = ['tex'] as const;
export type DashboardBannerType = (typeof dashboardBannerTypes)[number] | null;

export const isDashboardBannerType = (bannerType: unknown): bannerType is DashboardBannerType =>
    bannerType === null ||
    (typeof bannerType === 'string' && isArrayMember(bannerType, dashboardBannerTypes));
