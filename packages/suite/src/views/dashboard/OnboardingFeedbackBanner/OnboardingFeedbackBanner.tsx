import { AnimatePresence, motion } from 'framer-motion';

import { useServices } from '@suite-common/dependency-injection';
import { selectAllAccountsToList } from '@suite-common/wallet-core';
import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useExternalLink } from '@suite/external-links';
import { selectIsOnboardingFeedbackBannerShown, setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { Box, Button, Column, Image, Paragraph, Row, Text } from '@trezor/components';
import { borders } from '@trezor/theme';
import { DASHBOARD_ONBOARDING_FEEDBACK_URL } from '@trezor/urls';

import { useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';
import { ContentFlex, useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

import { CloseButton } from '../DashboardPromoBanner/CommonPromoBannerComponents';
import { bannerAnimationConfig } from '../banner-animations';

const Title = ({ isVerticalLayout }: { isVerticalLayout: boolean }) => {
    const { isBelowLaptop } = useLayoutSize();

    return (
        <Paragraph
            typographyStyle={isBelowLaptop ? 'headline-sm' : 'headline-md'}
            flex="1"
            margin={{ right: isVerticalLayout ? 32 : 0 }}
        >
            <Translation id="TR_ONBOARDING_FEEDBACK_BANNER_TITLE" />
        </Paragraph>
    );
};

const Description = () => {
    const { isBelowDesktop } = useLayoutSize();

    return (
        <Text typographyStyle={isBelowDesktop ? 'body-sm-strong' : 'headline-sm'}>
            <Translation id="TR_ONBOARDING_FEEDBACK_BANNER_DESCRIPTION" />
        </Text>
    );
};

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

    const isBannerShown = useSelector(selectIsOnboardingFeedbackBannerShown);
    const accounts = useSelector(selectAllAccountsToList);
    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);

    const isDeviceEmpty = accounts.every(account => account.empty);

    // Only show on the first post-onboarding "wallet is ready" state: the user is
    // eligible (flag set on onboarding completion) and the empty-wallet dashboard is
    // what's currently rendered (device empty, discovery settled, a device present).
    const isEligible = isBannerShown && isDeviceEmpty && discoveryStatus?.status !== 'loading';

    const clearBanner = () => {
        dispatch(setFlag({ key: 'showOnboardingFeedbackBanner', value: false }));
    };

    const handleCTAClick = () => {
        analytics.report({
            type: events.onboardingFeedbackBannerEvent.name,
            payload: { action: 'cta', platform: 'desktop' },
        });
        clearBanner();
    };

    const handleClose = () => {
        analytics.report({
            type: events.onboardingFeedbackBannerEvent.name,
            payload: { action: 'close', platform: 'desktop' },
        });
        clearBanner();
    };

    return (
        <AnimatePresence>
            {isEligible && (
                <motion.div key="onboarding-feedback-banner" {...bannerAnimationConfig}>
                    <Box
                        height={isVerticalLayout ? undefined : 213}
                        //padding={{ left: 24, top: isVerticalLayout ? 16 : 0 }}
                        backgroundColor="elementFillNeutralSofter"
                        borderRadius={borders.radii.sm}
                        overflow="hidden"
                        position={{ type: 'relative' }}
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

                                <CTAButton onClick={handleCTAClick} isBelowLaptop={isBelowLaptop} />
                            </Column>

                            <Row
                                height="100%"
                                alignItems="flex-end"
                                padding={isBelowLaptop ? 0 : 12}
                                margin={{ right: isBelowLaptop ? 0 : 60 }}
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
                                    borderRadius={borders.radii.sm}
                                    width={isBelowLaptop ? '100%' : undefined}
                                />
                            </Row>
                        </ContentFlex>
                        <CloseButton onClose={handleClose} />
                    </Box>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
