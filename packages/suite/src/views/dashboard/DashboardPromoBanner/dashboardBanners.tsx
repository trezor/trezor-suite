import { type FlagsState } from '@suite/flags';
import { type selectSelectedDevice } from '@suite-common/device';
import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { DeviceModelInternal, hasBitcoinOnlyFirmware } from '@trezor/device-utils';

import { StablecoinYieldBanner } from './StablecoinYieldBanner';
import { TS7Banner } from './TS7Banner';
import { TrezorExpertBanner } from './TrezorExpertBanner';
import { type DashboardBannerType } from './dashboardBannerTypes';

export type BannerHandlers = {
    onClose: () => void;
    onCTAClick: () => void;
};

type BannerEligibilityContext = {
    selectedDevice: ReturnType<typeof selectSelectedDevice>;
};

type DashboardBannerDefinition = {
    flag: keyof FlagsState;
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
    tex: {
        flag: 'showTEXDashboardPromoBanner',
        render: handlers => <TrezorExpertBanner {...handlers} />,
    },
    'stablecoin-yield': {
        flag: 'showStablecoinYieldDashboardPromoBanner',
        isEligible: ({ selectedDevice }) => !hasBitcoinOnlyFirmware(selectedDevice),
        render: handlers => <StablecoinYieldBanner {...handlers} />,
    },
};
