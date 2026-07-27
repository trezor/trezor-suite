import { type ReactNode } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider, useTheme } from 'styled-components';

import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { useExternalLink } from '@suite/external-links';
import { setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { Box, Button, Column, Image, Paragraph, Row, intermediaryTheme } from '@trezor/components';
import { DASHBOARD_ONBOARDING_FEEDBACK_URL } from '@trezor/urls';

import { useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';
import { ContentFlex, useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

import { selectShouldShowOnboardingFeedbackBanner } from './onboardingFeedbackBannerSelectors';
import { CloseButton } from '../DashboardPromoBanner/CommonPromoBannerComponents';
import { bannerAnimationConfig } from '../banner-animations';

const Title = ({ isVerticalLayout }: { isVerticalLayout: boolean }) => {
    const { isBelowLaptop } = useLayoutSize();
    const { variant } = useTheme();
    const isDarkMode = variant === 'dark';

    return (
        <Paragraph
            typographyStyle={isBelowLaptop ? 'headline-sm' : 'headline-md'}
            flex="1"
            margin={{ right: isVerticalLayout ? 32 : 0 }}
            color={isBelowLaptop && !isDarkMode ? 'contentPrimaryInverse' : 'contentPrimary'}
        >
            <Translation id="TR_ONBOARDING_FEEDBACK_BANNER_TITLE" />
        </Paragraph>
    );
};

const Description = () => {
    const { isBelowDesktop, isBelowLaptop } = useLayoutSize();
    const { variant } = useTheme();
    const isDarkMode = variant === 'dark';

    return (
        <Paragraph
            typographyStyle={isBelowDesktop ? 'body-sm-strong' : 'headline-sm'}
            color={isBelowLaptop && !isDarkMode ? 'contentPrimaryInverse' : 'contentPrimary'}
        >
            <Translation id="TR_ONBOARDING_FEEDBACK_BANNER_DESCRIPTION" />
        </Paragraph>
    );
};

export const ForceDarkTheme = ({
    children,
    isActive,
}: {
    children: ReactNode;
    isActive: boolean;
}) =>
    isActive ? (
        <ThemeProvider theme={{ variant: 'dark', ...intermediaryTheme.dark }}>
            {children}
        </ThemeProvider>
    ) : (
        children
    );

const CTAButton = ({ onClick, isBelowLaptop }: { onClick: () => void; isBelowLaptop: boolean }) => {
    const href = useExternalLink(DASHBOARD_ONBOARDING_FEEDBACK_URL);

    return (
        <Button
            intent="neutral"
            onClick={onClick}
            size={isBelowLaptop ? 'medium' : 'large'}
            href={href}
            data-testid="@dashboard/onboarding-feedback-banner/button"
        >
            <Translation id="TR_ONBOARDING_FEEDBACK_BANNER_BUTTON" />
        </Button>
    );
};

export const OnboardingFeedbackBanner = () => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { isBelowLaptop, isBelowDesktop } = useLayoutSize();
    const isVerticalLayout = useIsContentBelowBreakpoint();

    const isEligible = useSelector(selectShouldShowOnboardingFeedbackBanner);

    const clearBanner = () => {
        dispatch(setFlag({ key: 'showOnboardingFeedbackBanner', value: false }));
    };

    const handleCTAClick = () => {
        analytics.report({
            type: events.onboardingFeedbackBannerClickedEvent.name,
            payload: { action: 'cta', platform: 'desktop', origin: 'postOnboardingDashboard' },
        });
        clearBanner();
    };

    const handleClose = () => {
        analytics.report({
            type: events.onboardingFeedbackBannerClickedEvent.name,
            payload: { action: 'close', platform: 'desktop', origin: 'postOnboardingDashboard' },
        });
        clearBanner();
    };

    return (
        <ForceDarkTheme isActive={isBelowLaptop}>
            <AnimatePresence>
                {isEligible && (
                    <motion.div key="onboarding-feedback-banner" {...bannerAnimationConfig}>
                        <Box
                            height={isVerticalLayout ? undefined : 213}
                            backgroundColor="elementFillNeutralSofter"
                            borderRadius={12}
                            overflow="hidden"
                            data-testid="@dashboard/onboarding-feedback-banner"
                        >
                            <ContentFlex
                                height="100%"
                                margin={{ right: isBelowDesktop ? undefined : 48 }}
                                justifyContent="space-between"
                                gap={24}
                            >
                                <Column
                                    gap={isBelowDesktop ? 16 : 24}
                                    margin={{ horizontal: 24, vertical: isVerticalLayout ? 16 : 0 }}
                                    zIndex={1}
                                >
                                    <Column gap={isBelowLaptop ? 4 : 8}>
                                        <Title isVerticalLayout={isVerticalLayout} />
                                        <Description />
                                    </Column>

                                    <CTAButton
                                        onClick={handleCTAClick}
                                        isBelowLaptop={isBelowLaptop}
                                    />
                                </Column>

                                <Row
                                    height="100%"
                                    alignItems="flex-end"
                                    padding={isBelowLaptop ? 0 : 12}
                                    margin={{ right: isBelowLaptop ? 0 : 64 }}
                                    position={
                                        isBelowLaptop
                                            ? { type: 'absolute', top: 0, left: 0 }
                                            : undefined
                                    }
                                    width={isBelowLaptop ? '100%' : undefined}
                                >
                                    <Image
                                        image="DASHBOARD_FEEDBACK_BANNER"
                                        height="100%"
                                        objectFit="cover"
                                        objectPosition="left"
                                        borderRadius={12}
                                        width={isBelowLaptop ? '100%' : undefined}
                                    />
                                </Row>
                            </ContentFlex>
                            <CloseButton onClose={handleClose} />
                        </Box>
                    </motion.div>
                )}
            </AnimatePresence>
        </ForceDarkTheme>
    );
};
