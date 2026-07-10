import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import {
    selectRememberedHiddenWalletsCount,
    selectRememberedStandardWalletsCount,
} from '@suite-common/device';
import { Box, Button, Column, Divider, Row, SvgImage, Tooltip } from '@trezor/components';
import { isWeb } from '@trezor/env-utils';
import { UsersFilledIcon } from '@trezor/icons';
import { QrCode } from '@trezor/product-components';
import { breakpoints } from '@trezor/theme';
import {
    SUITE_MOBILE_APP_STORE,
    SUITE_MOBILE_PLAY_STORE,
    SUITE_REFERRAL,
    SUITE_URL,
} from '@trezor/urls';

import { useGuide } from 'src/hooks/guide';
import { useSelector } from 'src/hooks/suite';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';

import { StoreBadge } from '../../components/suite/StoreBadge';
import { ContentFlex, useIsContentBelowBreakpoint } from '../../support/suite/ContentFlex';

const Container = styled.footer`
    width: 100%;
    flex-shrink: 0;
`;

type StoreBadgeWithQrProps = {
    url: string;
    image: 'APP_STORE' | 'PLAY_STORE';
    analyticsPayload: 'ios' | 'android';
};

const StoreBadgeWithQr = ({ url, image, analyticsPayload }: StoreBadgeWithQrProps) => {
    const { isBelowTablet } = useLayoutSize();
    const { analytics } = useServices(selectDesktopAnalyticsDep);

    return (
        <Tooltip
            delayShow={0}
            isActive={!isBelowTablet}
            cursor={isBelowTablet ? 'not-allowed' : undefined}
            content={
                <Column alignItems="center" gap={10} padding={{ top: 4 }}>
                    <SvgImage image={image} height={26} color="contentPrimary" />
                    <Box
                        height={140}
                        width={140}
                        padding={4}
                        backgroundColor="elementFillContrast"
                        borderRadius={6}
                    >
                        <QrCode value={url} color="contentPrimaryInverse" />
                    </Box>
                </Column>
            }
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
                image={image}
            />
        </Tooltip>
    );
};

const ReferralButton = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
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
            iconLeft={UsersFilledIcon}
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

const DesktopAppPromoButton = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { isBelowTablet } = useLayoutSize();

    if (!isWeb() || isBelowTablet) {
        return null;
    }

    return (
        <Button
            href={SUITE_URL}
            intent="neutral"
            priority="secondary"
            size="small"
            onClick={() =>
                analytics.report({
                    type: events.promoDesktopEvent.name,
                    payload: { placement: 'footer' },
                })
            }
        >
            <Translation id="TR_DESKTOP_APP_PROMO_GET" />
        </Button>
    );
};

export const DashboardFooter = () => {
    const breakpoint = isWeb() ? breakpoints.laptop : breakpoints.tablet;
    const isVerticalLayout = useIsContentBelowBreakpoint(breakpoint);
    const { isBelowTablet } = useLayoutSize();
    const { isGuideOpen } = useGuide();

    return (
        <Container>
            <Divider margin={0} strokeWidth={1} />
            <ContentFlex
                padding={{ horizontal: isVerticalLayout ? 0 : 16 }}
                gap={isVerticalLayout ? 0 : 32}
                flex="1"
                hasDivider
                alignItems="stretch"
                breakpoint={breakpoint}
            >
                <Row
                    flex="1 1 50%"
                    gap={isVerticalLayout ? 12 : 16}
                    justifyContent={isVerticalLayout ? 'center' : 'flex-start'}
                    padding={{ vertical: 12 }}
                    flexWrap="wrap"
                >
                    <ReferralButton />
                    <DesktopAppPromoButton />
                </Row>
                <Row
                    flex="1 1 50%"
                    padding={{
                        bottom: 16,
                        top: isVerticalLayout ? 12 : 16,
                    }}
                >
                    <Row
                        justifyContent={isVerticalLayout ? 'center' : 'flex-end'}
                        gap={isVerticalLayout ? 12 : 16}
                        width="100%"
                    >
                        <StoreBadgeWithQr
                            url={SUITE_MOBILE_APP_STORE}
                            image="APP_STORE"
                            analyticsPayload="ios"
                        />
                        <StoreBadgeWithQr
                            url={SUITE_MOBILE_PLAY_STORE}
                            image="PLAY_STORE"
                            analyticsPayload="android"
                        />
                    </Row>
                    {/* Spacer to avoid overlapping with the guide button */}
                    {!isBelowTablet && !isVerticalLayout && (
                        <AnimatePresence>
                            <motion.div
                                animate={{
                                    width: isGuideOpen ? 0 : 68,
                                }}
                                transition={{ duration: 0.3 }}
                            >
                                <Box width={68} flex="0" />
                            </motion.div>
                        </AnimatePresence>
                    )}
                </Row>
            </ContentFlex>
        </Container>
    );
};
