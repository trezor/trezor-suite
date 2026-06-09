import styled from 'styled-components';

import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { useExternalLink } from '@suite/external-links';
import {
    type FlagsRootState,
    selectAreNoDeviceEshopBannersDisabled,
    selectIsNoDeviceEshopSidebarBannerShown,
    setFlag,
} from '@suite/flags';
import { Translation } from '@suite/intl';
import { type RouterRootState, selectRouterApp } from '@suite/router';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type DeviceRootState, selectPhysicalDeviceWallets } from '@suite-common/device';
import { Image } from '@trezor/components';
import { SidebarBanner } from '@trezor/product-components';
import { paletteV2 } from '@trezor/theme';
import { ESHOP_STORE_URL, withGetTrezorCtaUtm } from '@trezor/urls';

import { useDispatch } from 'src/hooks/suite';

const HeroContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
        100deg,
        ${paletteV2.lightGreenAlpha75} 0,
        ${paletteV2.lightGreen100} 100%
    );
    height: 140px;
    width: 100%;
`;

type NoDeviceEshopSidebarBannerRootState = DeviceRootState & FlagsRootState & RouterRootState;

const isNoDeviceEshopSidebarBannerRoute = (state: RouterRootState) => {
    const routerApp = selectRouterApp(state);

    // After reset, users land on the start screen (`initialRun`) rather than the dashboard.
    return routerApp === 'dashboard' || routerApp === 'start';
};

export const selectShouldShowNoDeviceEshopSidebarBanner = (
    state: NoDeviceEshopSidebarBannerRootState,
) =>
    isNoDeviceEshopSidebarBannerRoute(state) &&
    selectIsNoDeviceEshopSidebarBannerShown(state) &&
    !selectAreNoDeviceEshopBannersDisabled(state) &&
    selectPhysicalDeviceWallets(state).length === 0;

export const NoDeviceEshopSidebarBanner = () => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const href = useExternalLink(withGetTrezorCtaUtm(ESHOP_STORE_URL, 'dashboard'));

    const handleClose = () => {
        analytics.report({
            type: events.promoNoDeviceEshopCtaEvent.name,
            payload: { origin: 'dashboard', platform: 'desktop', action: 'close' },
        });
        dispatch(setFlag({ key: 'showNoDeviceEshopSidebarBanner', value: false }));
    };

    const handleClick = () => {
        analytics.report({
            type: events.promoNoDeviceEshopCtaEvent.name,
            payload: { origin: 'dashboard', platform: 'desktop', action: 'cta' },
        });
    };

    return (
        <SidebarBanner
            ctaDataTestId="@notification/no-device-eshop-banner/button"
            ctaHref={href}
            ctaLabel={<Translation id="TR_NO_DEVICE_ESHOP_BANNER_CTA" />}
            closeLabel={<Translation id="TR_DISMISS" />}
            data-testid="@notification/no-device-eshop-banner"
            description={<Translation id="TR_NO_DEVICE_ESHOP_BANNER_DESCRIPTION" />}
            heading={<Translation id="TR_NO_DEVICE_ESHOP_BANNER_HEADING" />}
            heroContent={
                <HeroContainer>
                    <Image height="75%" image="TREZOR_T3W1_PACKSHOT" />
                </HeroContainer>
            }
            intent="neutral"
            onClose={handleClose}
            onClick={handleClick}
        />
    );
};
