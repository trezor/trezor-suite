import { type BooleanFlagKey } from '@suite/flags';
import { type selectSelectedDevice } from '@suite-common/device';
import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { DeviceModelInternal, hasBitcoinOnlyFirmware } from '@trezor/device-utils';

import { DefiYieldBanner } from './DefiYieldBanner';
import { ETHVaultBanner } from './ETHVaultBanner';
import { StablecoinYieldBanner } from './StablecoinYieldBanner';
import { TS7Banner } from './TS7Banner';
import { type DashboardBannerType } from './dashboardBannerTypes';

export type BannerHandlers = {
    onClose: () => void;
    onCTAClick: () => void;
};

type BannerEligibilityContext = {
    selectedDevice: ReturnType<typeof selectSelectedDevice>;
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
    'stablecoin-yield': {
        flag: 'showStablecoinYieldDashboardPromoBanner',
        isEligible: ({ selectedDevice }) => !hasBitcoinOnlyFirmware(selectedDevice),
        render: handlers => <StablecoinYieldBanner {...handlers} />,
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
};
