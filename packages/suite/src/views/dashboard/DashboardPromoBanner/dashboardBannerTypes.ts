import { isArrayMember } from '@trezor/utils';

export const blackFridayHolidayBannerTypes = [
    'bfh26-ts7-accessory-pack',
    'bfh26-keep-metal',
    'bfh26-ts3-gift',
    'bfh26-ts3-backup',
    'bfh26-ts7-complete-kit',
    'bfh26-egift-card',
    'bfh26-ts7-upgrade',
] as const;
export type BlackFridayHolidayBannerType = (typeof blackFridayHolidayBannerTypes)[number];

export const dashboardBannerTypes = [
    'ts7',
    'defi-yield',
    'eth-vault',
    'trading-experience',
    ...blackFridayHolidayBannerTypes,
] as const;
export type DashboardBannerType = (typeof dashboardBannerTypes)[number];
export type DashboardBannerTypeWithNull = DashboardBannerType | null;

export const isDashboardBannerType = (
    bannerType: unknown,
): bannerType is DashboardBannerTypeWithNull =>
    bannerType === null ||
    (typeof bannerType === 'string' && isArrayMember(bannerType, dashboardBannerTypes));
