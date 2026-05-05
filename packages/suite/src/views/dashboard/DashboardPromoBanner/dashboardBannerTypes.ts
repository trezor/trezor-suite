import { isArrayMember } from '@trezor/utils';

export const dashboardBannerTypes = ['tex', 'ts7', 'stablecoin-yield'] as const;
export type DashboardBannerType = (typeof dashboardBannerTypes)[number];
export type DashboardBannerTypeWithNull = DashboardBannerType | null;

export const isDashboardBannerType = (
    bannerType: unknown,
): bannerType is DashboardBannerTypeWithNull =>
    bannerType === null ||
    (typeof bannerType === 'string' && isArrayMember(bannerType, dashboardBannerTypes));
