import styled from 'styled-components';

import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { useExternalLink } from '@suite/external-links';
import { type FlagsRootState, selectAreNoDeviceEshopBannersDisabled } from '@suite/flags';
import { Translation, type TranslationKey } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type DeviceRootState, selectPhysicalDeviceWallets } from '@suite-common/device';
import {
    Button,
    Card,
    Column,
    Divider,
    H3,
    Icon,
    type IconComponent,
    Image,
    Paragraph,
    Row,
    Text,
} from '@trezor/components';
import {
    ArrowLineUpRightIcon,
    DevicesFilledIcon,
    RocketLaunchFilledIcon,
    ShieldStarFilledIcon,
} from '@trezor/icons';
import { breakpoints, paletteV2 } from '@trezor/theme';
import { ESHOP_STORE_URL, withGetTrezorCtaUtm } from '@trezor/urls';

import { ContentFlex, useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

const HeroContainer = styled.div`
    display: flex;
    flex: 0 0 230px;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
        100deg,
        ${paletteV2.lightGreenAlpha75} 0,
        ${paletteV2.lightGreen100} 100%
    );
    min-height: 190px;
    padding: 10px 20px;
    border-radius: 12px;
`;

const bulletPointValues: Array<{ icon: IconComponent; textId: TranslationKey }> = [
    { icon: ShieldStarFilledIcon, textId: 'TR_NO_DEVICE_ESHOP_BANNER_BULLET_SECURITY' },
    { icon: DevicesFilledIcon, textId: 'TR_NO_DEVICE_ESHOP_BANNER_BULLET_APP' },
    { icon: RocketLaunchFilledIcon, textId: 'TR_NO_DEVICE_ESHOP_BANNER_BULLET_SETUP' },
];

type NoDeviceEshopSettingsBannerRootState = DeviceRootState & FlagsRootState;

export const selectShouldShowNoDeviceEshopSettingsBanner = (
    state: NoDeviceEshopSettingsBannerRootState,
) =>
    !selectAreNoDeviceEshopBannersDisabled(state) &&
    selectPhysicalDeviceWallets(state).length === 0;

export const NoDeviceEshopSettingsBanner = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const isContentBelowBreakpoint = useIsContentBelowBreakpoint(breakpoints.tablet);
    const href = useExternalLink(withGetTrezorCtaUtm(ESHOP_STORE_URL, 'settings'));

    const handleClick = () => {
        analytics.report({
            type: events.promoNoDeviceEshopCtaEvent.name,
            payload: { origin: 'settings', platform: 'desktop', action: 'cta' },
        });
    };

    return (
        <Card data-testid="@settings/no-device-eshop-banner" paddingType="none">
            <ContentFlex
                padding={{ horizontal: 20, vertical: 16 }}
                gap={20}
                alignItems="stretch"
                justifyContent="space-between"
                breakpoint={breakpoints.tablet}
                isReversed={isContentBelowBreakpoint}
            >
                <Column>
                    <Column>
                        <H3>
                            <Translation id="TR_NO_DEVICE_ESHOP_BANNER_HEADING" />
                        </H3>
                        <Paragraph intent="neutral" priority="secondary">
                            <Translation id="TR_NO_DEVICE_ESHOP_BANNER_SETTINGS_DESCRIPTION" />
                        </Paragraph>
                    </Column>
                    <Divider margin={{ vertical: 12 }} />
                    <Row gap={32} hasDivider alignItems="flex-start" margin={{ bottom: 24 }}>
                        {bulletPointValues.map(({ icon, textId }) => (
                            <Column key={textId} gap={8} flex="1" padding={{ right: 16 }}>
                                <Icon as={icon} size={20} intent="neutral" priority="secondary" />
                                <Text
                                    typographyStyle="body-xs"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation id={textId} />
                                </Text>
                            </Column>
                        ))}
                    </Row>
                    <Button
                        intent="neutral"
                        priority="primary"
                        iconRight={ArrowLineUpRightIcon}
                        href={href}
                        onClick={handleClick}
                        data-testid="@settings/no-device-eshop-banner/button"
                        margin={{ top: 'auto' }}
                    >
                        <Translation id="TR_NO_DEVICE_ESHOP_BANNER_CTA" />
                    </Button>
                </Column>
                <HeroContainer>
                    <Image
                        width="100%"
                        height="100%"
                        maxWidth={150}
                        objectFit="contain"
                        image="TREZOR_T3W1_PACKSHOT"
                    />
                </HeroContainer>
            </ContentFlex>
        </Card>
    );
};
