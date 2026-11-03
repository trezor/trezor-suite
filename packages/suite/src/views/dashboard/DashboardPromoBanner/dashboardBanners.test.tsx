import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';

import { blackFridayHolidayBannerTypes } from './dashboardBannerTypes';
import { type BannerEligibilityContext, DASHBOARD_BANNERS } from './dashboardBanners';

const getEligibleCampaigns = (context: BannerEligibilityContext) =>
    blackFridayHolidayBannerTypes.filter(
        bannerType => DASHBOARD_BANNERS[bannerType].isEligible?.(context) ?? true,
    );

describe('Black Friday Holiday banner targeting', () => {
    it('shows Safe 7 owner offers without the upgrade banner', () => {
        const selectedDevice = mockSuiteDevice({}, { internal_model: DeviceModelInternal.T3W1 });

        expect(getEligibleCampaigns({ selectedDevice, isRegionRestricted: false })).toEqual([
            'bfh26-ts7-accessory-pack',
            'bfh26-keep-metal',
            'bfh26-ts3-gift',
            'bfh26-ts3-backup',
            'bfh26-ts7-complete-kit',
            'bfh26-egift-card',
        ]);
    });

    it.each(Object.values(DeviceModelInternal).filter(model => model !== DeviceModelInternal.T3W1))(
        'offers an upgrade instead of Safe 7 accessories for %s',
        model => {
            const selectedDevice = mockSuiteDevice({}, { internal_model: model });

            expect(getEligibleCampaigns({ selectedDevice, isRegionRestricted: false })).toEqual([
                'bfh26-keep-metal',
                'bfh26-ts3-gift',
                'bfh26-ts7-complete-kit',
                'bfh26-egift-card',
                'bfh26-ts7-upgrade',
            ]);
        },
    );

    it('includes remembered devices while disconnected', () => {
        const selectedDevice = mockSuiteDevice(
            { connected: false, remember: true },
            { internal_model: DeviceModelInternal.T3T1 },
        );

        expect(getEligibleCampaigns({ selectedDevice, isRegionRestricted: false })).toEqual([
            'bfh26-keep-metal',
            'bfh26-ts3-gift',
            'bfh26-ts7-complete-kit',
            'bfh26-egift-card',
            'bfh26-ts7-upgrade',
        ]);
    });

    it('shows general and upgrade offers without a selected device', () => {
        expect(
            getEligibleCampaigns({ selectedDevice: undefined, isRegionRestricted: false }),
        ).toEqual([
            'bfh26-keep-metal',
            'bfh26-ts3-gift',
            'bfh26-ts7-complete-kit',
            'bfh26-egift-card',
            'bfh26-ts7-upgrade',
        ]);
    });
});
