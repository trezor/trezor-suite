import { useState } from 'react';

import styled from 'styled-components';

import {
    selectRememberedHiddenWalletsCount,
    selectRememberedStandardWalletsCount,
} from '@suite-common/wallet-core';
import { Button, Column, Divider, Image, Row, Tooltip } from '@trezor/components';
import { isWeb } from '@trezor/env-utils';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';
import {
    SUITE_MOBILE_APP_STORE,
    SUITE_MOBILE_PLAY_STORE,
    SUITE_REFERRAL,
    SUITE_URL,
} from '@trezor/urls';

import { QrCode, Translation, TrezorLink } from 'src/components/suite';
import { MAX_CONTENT_WIDTH_NUMERIC } from 'src/constants/suite/layout';
import { useSelector } from 'src/hooks/suite';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';

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

const BadgeContainer = styled.div<{ $isHighlighted: boolean }>`
    opacity: ${({ $isHighlighted }) => ($isHighlighted ? 1 : 0.6)};
    transition: opacity 0.3s;
    cursor: pointer;
    display: flex;
    align-items: center;
`;

const QRBox = styled.div`
    width: 140px;
    height: 140px;
    padding: 4px;
    background-color: white;
    border-radius: 6px;
`;

type QrType = 'app-store' | 'play-store';

type StoreBadgeProps = {
    url: string;
    image: 'APP_STORE' | 'PLAY_STORE';
    type: QrType;
    analyticsPayload: 'ios' | 'android';
    shownQRState: [QrType | undefined, (type: QrType | undefined) => void];
};

const StoreBadge = ({
    url,
    image,
    type,
    analyticsPayload,
    shownQRState: [showQR, setShowQr],
}: StoreBadgeProps) => {
    const { isBelowTablet } = useLayoutSize();
    const [isTooltipOpen, setIsTooltipOpen] = useState(false);

    return (
        <Tooltip
            isOpen={isTooltipOpen}
            cursor={isBelowTablet ? 'not-allowed' : undefined}
            content={
                <Column alignItems="center">
                    <Image
                        margin={{ bottom: spacings.xs, top: spacings.xxxs }}
                        image={`${image}_TITLE`}
                        height={26}
                    />
                    <QRBox>
                        <QrCode value={url} />
                    </QRBox>
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
                <TrezorLink
                    href={url}
                    variant="nostyle"
                    onClick={() =>
                        analytics.report({
                            type: EventType.GetMobileApp,
                            payload: {
                                platform: analyticsPayload,
                            },
                        })
                    }
                >
                    <BadgeContainer $isHighlighted={showQR === type}>
                        <Image image={`${image}_BADGE`} height={35} maxWidth="unset" />
                    </BadgeContainer>
                </TrezorLink>
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
            <StoreBadge
                url={SUITE_MOBILE_APP_STORE}
                image="APP_STORE"
                type="app-store"
                analyticsPayload="ios"
                shownQRState={shownQRState}
            />
            <StoreBadge
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
    const hasAtLeastOneRememberedWallet = useSelector(
        state =>
            selectRememberedStandardWalletsCount(state) > 0 ||
            selectRememberedHiddenWalletsCount(state) > 0,
    );

    return (
        <Button
            href={SUITE_REFERRAL}
            variant="tertiary"
            icon="usersFilled"
            size="small"
            textWrap={false}
            onClick={() => {
                analytics.report({
                    type: EventType.ReferralButton,
                    payload: { hasAtLeastOneRememberedWallet },
                });
            }}
        >
            <Translation id="TR_DASHBOARD_REFERRAL_BUTTON" />
        </Button>
    );
};

export const DashboardFooter = () => {
    const { isBelowTablet } = useLayoutSize();
    const { contentWidth } = useResponsiveContext();
    const isVerticalLayout = contentWidth ? contentWidth < 650 : false;
    const Component = isVerticalLayout ? Column : Row;

    const isGuideIconInContent =
        contentWidth && !isVerticalLayout && !isBelowTablet
            ? contentWidth < MAX_CONTENT_WIDTH_NUMERIC + spacings.xxxxxl
            : false;

    return (
        <Container>
            <Divider margin={{ bottom: 0 }} />
            <Component
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
                            variant="tertiary"
                            size="small"
                            textWrap={false}
                            onClick={() =>
                                analytics.report({
                                    type: EventType.GetDesktopApp,
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
            </Component>
        </Container>
    );
};
