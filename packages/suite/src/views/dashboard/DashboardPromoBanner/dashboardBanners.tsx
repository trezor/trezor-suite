import { type BooleanFlagKey } from '@suite/flags';
import { type selectSelectedDevice } from '@suite-common/device';
import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { DeviceModelInternal, hasBitcoinOnlyFirmware } from '@trezor/device-utils';

import { BlackFridayHolidayBanner } from './BlackFridayHolidayBanner';
import { DefiYieldBanner } from './DefiYieldBanner';
import { ETHVaultBanner } from './ETHVaultBanner';
import { TS7Banner } from './TS7Banner';
import { TradingExperienceBanner } from './TradingExperienceBanner';
import { type DashboardBannerType } from './dashboardBannerTypes';

export type BannerHandlers = {
    onClose: () => void;
    onCTAClick: () => void;
};

export type BannerEligibilityContext = {
    selectedDevice: ReturnType<typeof selectSelectedDevice>;
    isRegionRestricted: boolean;
};

type DashboardBannerDefinition = {
    flag: BooleanFlagKey;
    isEligible?: (context: BannerEligibilityContext) => boolean;
    render: (handlers: BannerHandlers) => React.ReactNode;
};

/**
 * Single source of truth for dashboard promo banners. To add a new banner:
 * 1. add its type to `dashboardBannerTypes`
 * 2. add its flag to `FlagsState`
 * 3. add one entry here
 *
 * The `Record<DashboardBannerType, ...>` typing guarantees every banner type is handled.
 */
export const DASHBOARD_BANNERS: Record<DashboardBannerType, DashboardBannerDefinition> = {
    ts7: {
        flag: 'showTS7DashboardPromoBanner',
        isEligible: ({ selectedDevice }) =>
            getDeviceInternalModel(selectedDevice) !== DeviceModelInternal.T3W1,
        render: handlers => <TS7Banner {...handlers} />,
    },
    'defi-yield': {
        flag: 'showDefiYieldDashboardPromoBanner',
        isEligible: ({ selectedDevice }) => !hasBitcoinOnlyFirmware(selectedDevice),
        render: handlers => <DefiYieldBanner {...handlers} />,
    },
    'eth-vault': {
        flag: 'showETHVaultDashboardPromoBanner',
        isEligible: ({ selectedDevice }) => !hasBitcoinOnlyFirmware(selectedDevice),
        render: handlers => <ETHVaultBanner {...handlers} />,
    },
    'trading-experience': {
        flag: 'showTradingExperienceDashboardPromoBanner',
        isEligible: ({ selectedDevice, isRegionRestricted }) =>
            !hasBitcoinOnlyFirmware(selectedDevice) && !isRegionRestricted,
        render: handlers => <TradingExperienceBanner {...handlers} />,
    },
    'bfh26-ts7-accessory-pack': {
        flag: 'showBFH26TS7AccessoryPackDashboardPromoBanner',
        isEligible: ({ selectedDevice }) =>
            getDeviceInternalModel(selectedDevice) === DeviceModelInternal.T3W1,
        render: handlers => (
            <BlackFridayHolidayBanner bannerType="bfh26-ts7-accessory-pack" {...handlers} />
        ),
    },
    'bfh26-keep-metal': {
        flag: 'showBFH26KeepMetalDashboardPromoBanner',
        render: handlers => (
            <BlackFridayHolidayBanner bannerType="bfh26-keep-metal" {...handlers} />
        ),
    },
    'bfh26-ts3-gift': {
        flag: 'showBFH26TS3GiftDashboardPromoBanner',
        render: handlers => <BlackFridayHolidayBanner bannerType="bfh26-ts3-gift" {...handlers} />,
    },
    'bfh26-ts3-backup': {
        flag: 'showBFH26TS3BackupDashboardPromoBanner',
        isEligible: ({ selectedDevice }) =>
            getDeviceInternalModel(selectedDevice) === DeviceModelInternal.T3W1,
        render: handlers => (
            <BlackFridayHolidayBanner bannerType="bfh26-ts3-backup" {...handlers} />
        ),
    },
    'bfh26-ts7-complete-kit': {
        flag: 'showBFH26TS7CompleteKitDashboardPromoBanner',
        render: handlers => (
            <BlackFridayHolidayBanner bannerType="bfh26-ts7-complete-kit" {...handlers} />
        ),
    },
    'bfh26-egift-card': {
        flag: 'showBFH26EGiftCardDashboardPromoBanner',
        render: handlers => (
            <BlackFridayHolidayBanner bannerType="bfh26-egift-card" {...handlers} />
        ),
    },
    'bfh26-ts7-upgrade': {
        flag: 'showBFH26TS7UpgradeDashboardPromoBanner',
        isEligible: ({ selectedDevice }) =>
            getDeviceInternalModel(selectedDevice) !== DeviceModelInternal.T3W1,
        render: handlers => (
            <BlackFridayHolidayBanner bannerType="bfh26-ts7-upgrade" {...handlers} />
        ),
    },
};
