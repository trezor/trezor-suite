import { useState } from 'react';

import styled, { css } from 'styled-components';

import { Button, Column, Icon, Image, Row, Text, Tooltip, variables } from '@trezor/components';
import { isWeb } from '@trezor/env-utils';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';
import { SUITE_MOBILE_APP_STORE, SUITE_MOBILE_PLAY_STORE, SUITE_URL } from '@trezor/urls';

import { QrCode, Translation, TrezorLink } from 'src/components/suite';
import { HORIZONTAL_LAYOUT_PADDINGS, MAX_CONTENT_WIDTH_NUMERIC } from 'src/constants/suite/layout';
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
    border-top: 1px solid ${({ theme }) => theme.borderElevation0};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        border-radius: 20px;
        box-shadow: 0 -4px 6px -4px ${({ theme }) => theme.legacy.BOX_SHADOW_OPTION_CARD};
    }
`;

const promoContainerCss = css`
    display: flex;
    align-items: center;
    flex: 1;
    gap: 16px;
    height: 100%;
    padding: 0 ${HORIZONTAL_LAYOUT_PADDINGS};

    span {
        min-width: 100px;
    }
`;

const DesktopPromoContainer = styled.div`
    ${promoContainerCss};
    min-width: 50%;
    display: flex;
    justify-content: space-between;
    border-right: 1px solid ${({ theme }) => theme.borderElevation0};
`;

const MobilePromoContainer = styled.div`
    ${promoContainerCss};
    justify-content: start;

    ${variables.SCREEN_QUERY.MOBILE} {
        flex-direction: column;
        padding: 20px 16px;
    }
`;

const OSIcons = styled.div`
    display: flex;
    align-self: center;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
    opacity: 0.7;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const Badge = styled(Image)<{ $isHighlighted: boolean }>`
    max-width: unset;
    opacity: ${({ $isHighlighted }) => ($isHighlighted ? 1 : 0.6)};
    transition: opacity 0.3s;
    cursor: pointer;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StoreTitle = styled(Image)<{ $isDark: boolean }>`
    display: block;
    margin: 2px auto 6px;
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
    const { isMobileLayout } = useLayoutSize();
    const [isTooltipOpen, setIsTooltipOpen] = useState(false);
    const currentTheme = useSelector(state => state.suite.settings.theme.variant);

    return (
        <Tooltip
            isOpen={isTooltipOpen}
            cursor={isMobileLayout ? 'not-allowed' : undefined}
            content={
                <Column alignItems="center">
                    <StoreTitle
                        $isDark={currentTheme == 'dark'}
                        image={`${image}_TITLE`}
                        height={26}
                    />
                    <QRBox>
                        <QrCode value={url} />
                    </QRBox>
                </Column>
            }
        >
            <span
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
                    <Badge image={`${image}_BADGE`} height={35} $isHighlighted={showQR === type} />
                </TrezorLink>
            </span>
        </Tooltip>
    );
};

export const PromoBanner = () => {
    const shownQRState = useState<QrType>();
    const { isMobileLayout } = useLayoutSize();
    const { contentWidth } = useResponsiveContext();

    return (
        <Container>
            {isWeb() && !isMobileLayout && (
                <DesktopPromoContainer>
                    <Row gap={spacings.xs}>
                        <Image image="HOLLOW_APP_LOGO" width={44} height={44} />

                        <div>
                            <Text typographyStyle="label">
                                <Translation id="TR_MOBILE_APP_PROMO_TEXT" />
                            </Text>

                            <OSIcons>
                                <Icon name="appleLogo" size={14} />
                                <Icon name="linuxLogo" size={14} />
                                <Icon name="windowsLogo" size={12} />
                            </OSIcons>
                        </div>
                    </Row>

                    <Button
                        href={SUITE_URL}
                        variant="tertiary"
                        size="small"
                        onClick={() =>
                            analytics.report({
                                type: EventType.GetDesktopApp,
                            })
                        }
                    >
                        <Translation id="TR_DESKTOP_APP_PROMO_GET" />
                    </Button>
                </DesktopPromoContainer>
            )}

            <MobilePromoContainer>
                <Row
                    justifyContent="space-between"
                    width="100%"
                    margin={{
                        right:
                            contentWidth &&
                            contentWidth < MAX_CONTENT_WIDTH_NUMERIC + spacings.xxxxxl
                                ? spacings.xxxxxl
                                : 0,
                    }}
                >
                    <Text typographyStyle="label">
                        <Translation
                            values={{ b: text => <b>{text}</b> }}
                            id="TR_MOBILE_APP_PROMO_TEXT_FOOTER"
                        />
                    </Text>

                    <Row gap={spacings.xxs}>
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
                </Row>
            </MobilePromoContainer>
        </Container>
    );
};
