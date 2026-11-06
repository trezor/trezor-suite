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
