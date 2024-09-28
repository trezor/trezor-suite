import { useState } from 'react';
import styled, { css } from 'styled-components';
import { SUITE_MOBILE_APP_STORE, SUITE_MOBILE_PLAY_STORE, SUITE_URL } from '@trezor/urls';
import { EventType, analytics } from '@trezor/suite-analytics';
import { Button, Icon, Image, Tooltip, variables } from '@trezor/components';
import { Translation, QrCode, TrezorLink } from 'src/components/suite';
import { isWeb } from '@trezor/env-utils';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';
import { HORIZONTAL_LAYOUT_PADDINGS } from 'src/constants/suite/layout';
import { useSelector } from 'src/hooks/suite';
import { spacingsPx } from '@trezor/theme';

const Container = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    width: 100%;
    height: 70px;
    border-top: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};

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
    ${promoContainerCss}
    min-width: 50%;
    border-right: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
`;

const MobilePromoContainer = styled.div`
    ${promoContainerCss}
    justify-content: start;
    margin: ${spacingsPx.sm} ${spacingsPx.xxxl} auto auto;
    padding-bottom: ${spacingsPx.sm};

    ${variables.SCREEN_QUERY.MOBILE} {
        flex-direction: column;
        gap: 0;
        padding: 20px 16px;
        justify-content: space-between;
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

const StyledLink = styled(TrezorLink)`
    margin-left: auto;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const DesktopLinkButton = styled(Button)`
    background: ${({ theme }) => theme.legacy.STROKE_GREY};
    color: ${({ theme }) => theme.legacy.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    transition: opacity 0.15s;
    opacity: 0.6;

    &:hover,
    &:focus {
        background: ${({ theme }) => theme.legacy.STROKE_GREY};
        opacity: 1;
    }
`;

const BadgeContainer = styled.div`
    display: flex;
    gap: 10px;

    ${variables.SCREEN_QUERY.MOBILE} {
        margin: 0;
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledTooltip = styled(Tooltip)`
    display: flex;

    > div {
        display: flex;
        align-items: center;
    }
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
    ${({ $isDark }) =>
        $isDark &&
        `
            filter: invert(1);
    `}
`;

const QR = styled(QrCode)`
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
        <StyledTooltip
            isOpen={isTooltipOpen}
            disabled={isMobileLayout}
            content={
                <div>
                    <StoreTitle
                        $isDark={currentTheme === 'dark'}
                        image={`${image}_TITLE`}
                        height={26}
                    />
                    <QR value={url} />
                </div>
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
        </StyledTooltip>
    );
};

export const PromoBanner = () => {
    const shownQRState = useState<QrType>();

    const { isMobileLayout } = useLayoutSize();

    return (
        <Container>
            {isWeb() && !isMobileLayout && (
                <DesktopPromoContainer>
                    <Image image="HOLLOW_APP_LOGO" width={44} height={44} />

                    <div>
                        <Translation id="TR_DESKTOP_APP_PROMO_TEXT_FOOTER" />

                        <OSIcons>
                            <Icon name="osMac" size={14} />
                            <Icon name="osLinux" size={14} />
                            <Icon name="osWindows" size={12} />
                        </OSIcons>
                    </div>

                    <StyledLink
                        href={SUITE_URL}
                        variant="nostyle"
                        onClick={() =>
                            analytics.report({
                                type: EventType.GetDesktopApp,
                            })
                        }
                    >
                        <DesktopLinkButton>
                            <Translation id="TR_DESKTOP_APP_PROMO_GET" />
                        </DesktopLinkButton>
                    </StyledLink>
                </DesktopPromoContainer>
            )}

            <MobilePromoContainer>
                <Translation id="TR_MOBILE_APP_PROMO_TEXT_FOOTER" />

                <BadgeContainer>
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
                </BadgeContainer>
            </MobilePromoContainer>
        </Container>
    );
};
