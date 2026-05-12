import { useState } from 'react';

import styled from 'styled-components';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import {
    selectRememberedHiddenWalletsCount,
    selectRememberedStandardWalletsCount,
} from '@suite-common/device';
import { Box, Button, Column, Divider, Image, Row, Tooltip } from '@trezor/components';
import { isWeb } from '@trezor/env-utils';
import { spacings } from '@trezor/theme';
import {
    SUITE_MOBILE_APP_STORE,
    SUITE_MOBILE_PLAY_STORE,
    SUITE_REFERRAL,
    SUITE_URL,
} from '@trezor/urls';

import { QrCode } from 'src/components/suite';
import { MAX_CONTENT_WIDTH_NUMERIC } from 'src/constants/suite/layout';
import { useSelector } from 'src/hooks/suite';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';
import { useAnalytics } from 'src/support/useAnalytics';

import { StoreBadge } from '../../components/suite/StoreBadge';
import { ContentFlex, useIsContentBelowBreakpoint } from '../../support/suite/ContentFlex';
import { useResponsiveContext } from '../../support/suite/ResponsiveContext';

const Container = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    width: 100%;
    height: 70px;
`;

const Interaction = styled.span`
    display: flex;
`;

type QrType = 'app-store' | 'play-store';

type StoreBadgeWithQrProps = {
    url: string;
    image: 'APP_STORE' | 'PLAY_STORE';
    type: QrType;
    analyticsPayload: 'ios' | 'android';
    shownQRState: [QrType | undefined, (type: QrType | undefined) => void];
};

const StoreBadgeWithQr = ({
    url,
    image,
    type,
    analyticsPayload,
    shownQRState: [showQR, setShowQr],
}: StoreBadgeWithQrProps) => {
    const { isBelowTablet } = useLayoutSize();
    const [isTooltipOpen, setIsTooltipOpen] = useState(false);
    const analytics = useAnalytics();

    return (
        <Tooltip
            isOpen={isTooltipOpen}
            cursor={isBelowTablet ? 'not-allowed' : undefined}
            hasArrow
            content={
                <Column alignItems="center">
                    <Box
                        backgroundColor="elementFillContrast"
                        borderRadius={6}
                        padding={{ vertical: spacings.xxxs, horizontal: spacings.xs }}
                        margin={{ bottom: spacings.xs, top: spacings.xxxs }}
                    >
                        <Image image={image} height={26} />
                    </Box>
                    <Box
                        height={140}
                        width={140}
                        padding={4}
                        backgroundColor="elementFillContrast"
                        borderRadius={6}
                    >
                        <QrCode value={url} />
                    </Box>
                </Column>
            }
        >
            <Interaction
                onMouseEnter={() => {
                    setIsTooltipOpen(true);
                    setShowQr(type);
                }}
                onMouseLeave={() => {
                    setIsTooltipOpen(false);
                    setShowQr(undefined);
                }}
            >
                <StoreBadge
                    url={url}
                    onClick={() =>
                        analytics.report({
                            type: events.promoMobileEvent.name,
                            payload: {
                                platform: analyticsPayload,
                            },
                        })
                    }
                    isHighlighted={showQR === type}
                    image={image}
                />
            </Interaction>
        </Tooltip>
    );
};

const MobileAppPromo = ({ hasRightMargin }: { hasRightMargin: boolean }) => {
    const shownQRState = useState<QrType>();

    return (
        <Row
            gap={spacings.xs}
            margin={{
                right: hasRightMargin ? spacings.xxxxxl : 0,
            }}
        >
            <StoreBadgeWithQr
                url={SUITE_MOBILE_APP_STORE}
                image="APP_STORE"
                type="app-store"
                analyticsPayload="ios"
                shownQRState={shownQRState}
            />
            <StoreBadgeWithQr
                url={SUITE_MOBILE_PLAY_STORE}
                image="PLAY_STORE"
                type="play-store"
                analyticsPayload="android"
                shownQRState={shownQRState}
            />
        </Row>
    );
};

const ReferralButton = () => {
    const analytics = useAnalytics();
    const hasAtLeastOneRememberedWallet = useSelector(
        state =>
            selectRememberedStandardWalletsCount(state) > 0 ||
            selectRememberedHiddenWalletsCount(state) > 0,
    );

    return (
        <Button
            href={SUITE_REFERRAL}
            intent="neutral"
            priority="secondary"
            iconLeft="usersFilled"
            size="small"
            onClick={() => {
                analytics.report({
                    type: events.promoReferralButtonEvent.name,
                    payload: { hasAtLeastOneRememberedWallet },
                });
            }}
        >
            <Translation id="TR_DASHBOARD_REFERRAL_BUTTON" />
        </Button>
    );
};

export const DashboardFooter = () => {
    const analytics = useAnalytics();
    const { isBelowTablet } = useLayoutSize();
    const { contentWidth } = useResponsiveContext();

    const isVerticalLayout = useIsContentBelowBreakpoint();

    const isGuideIconInContent =
        contentWidth && !isVerticalLayout && !isBelowTablet
            ? contentWidth < MAX_CONTENT_WIDTH_NUMERIC + spacings.xxxxxl
            : false;

    return (
        <Container>
            <Divider margin={{ bottom: 0 }} />
            <ContentFlex
                margin={{ left: spacings.md, right: spacings.md }}
                gap={isVerticalLayout ? 0 : spacings.md}
                flex="1"
                height="100%"
            >
                <Row
                    flex="1"
                    gap={spacings.xs}
                    margin={{ vertical: spacings.xs }}
                    justifyContent={isVerticalLayout ? 'center' : 'space-between'}
                >
                    <ReferralButton />
                    {isWeb() && !isBelowTablet && (
                        <Button
                            href={SUITE_URL}
                            intent="neutral"
                            priority="secondary"
                            size="small"
                            onClick={() =>
                                analytics.report({
                                    type: events.promoDesktopEvent.name,
                                })
                            }
                        >
                            <Translation id="TR_DESKTOP_APP_PROMO_GET" />
                        </Button>
                    )}
                </Row>
                {!isVerticalLayout && <Divider orientation="vertical" />}
                <Row
                    margin={{ vertical: spacings.xs }}
                    flex="1"
                    justifyContent={isVerticalLayout ? 'center' : 'flex-end'}
                >
                    <MobileAppPromo hasRightMargin={isGuideIconInContent} />
                </Row>
            </ContentFlex>
        </Container>
    );
};
