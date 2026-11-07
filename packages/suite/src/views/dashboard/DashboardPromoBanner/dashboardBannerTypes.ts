import { blackFridayHolidayBannerTypes } from '@suite-common/suite-constants';
import { isArrayMember } from '@trezor/utils';

export {
    blackFridayHolidayBannerTypes,
    type BlackFridayHolidayBannerType,
} from '@suite-common/suite-constants';

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
