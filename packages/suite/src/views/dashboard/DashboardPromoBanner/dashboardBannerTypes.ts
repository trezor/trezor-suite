import { isArrayMember } from '@trezor/utils';

export const dashboardBannerTypes = ['ts7', 'stablecoin-yield', 'defi-yield', 'eth-vault'] as const;
export type DashboardBannerType = (typeof dashboardBannerTypes)[number];
export type DashboardBannerTypeWithNull = DashboardBannerType | null;

export const isDashboardBannerType = (
    bannerType: unknown,
): bannerType is DashboardBannerTypeWithNull =>
    bannerType === null ||
    (typeof bannerType === 'string' && isArrayMember(bannerType, dashboardBannerTypes));
