import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { Box, Button, Column, Image, Paragraph, Row, Text } from '@trezor/components';

import { useDispatch, useLayoutSize } from 'src/hooks/suite';
import { ContentFlex, useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

import { AnimatedWrapper, CloseButton } from './CommonPromoBannerComponents';

type StablecoinYieldBannerProps = {
    onClose: () => void;
    onCTAClick: () => void;
    isVisible: boolean;
};

const Title = ({ isVerticalLayout }: { isVerticalLayout: boolean }) => {
    const { isBelowLaptop } = useLayoutSize();

    return (
        <Paragraph
            typographyStyle={isBelowLaptop ? 'headline-sm' : 'headline-md'}
            flex="1"
            margin={{ right: isVerticalLayout ? 32 : 0 }}
        >
            <Translation id="TR_PROMO_BANNER_DASHBOARD_STABLECOIN_YIELD_TITLE" />
        </Paragraph>
    );
};

const Description = () => {
    const { isBelowDesktop } = useLayoutSize();

    return (
        <Text typographyStyle={isBelowDesktop ? 'body-sm-strong' : 'headline-sm'}>
            <Translation id="TR_PROMO_BANNER_DASHBOARD_STABLECOIN_YIELD_DESCRIPTION" />
        </Text>
    );
};

const CTAButton = ({ onClick, isBelowLaptop }: { onClick: () => void; isBelowLaptop: boolean }) => (
    <Button
        intent="brand"
        onClick={onClick}
        size={isBelowLaptop ? 'medium' : 'large'}
        data-testid="@dashboard/promo-banner/stablecoin-yield/button"
    >
        <Translation id="TR_PROMO_BANNER_DASHBOARD_STABLECOIN_YIELD_BUTTON" />
    </Button>
);

export const StablecoinYieldBanner = ({
    onClose,
    onCTAClick,
    isVisible,
}: StablecoinYieldBannerProps) => {
    const dispatch = useDispatch();
    const { isBelowLaptop, isBelowDesktop } = useLayoutSize();
    const isVerticalLayout = useIsContentBelowBreakpoint();

    const handleCTAClick = () => {
        onCTAClick();
        dispatch(goto({ routeName: 'suite-earn' }));
    };

    return (
        <AnimatedWrapper isVisible={isVisible} flagToHide="showStablecoinYieldDashboardPromoBanner">
            <Box
                height={isVerticalLayout ? undefined : 213}
                padding={{ left: 24, top: isVerticalLayout ? 16 : 0 }}
                backgroundColor="legacyBackgroundTertiaryDefaultOnElevation0"
            >
                <ContentFlex
                    height="100%"
                    margin={{
                        right: isBelowDesktop ? undefined : 48,
                    }}
                    justifyContent="space-between"
                    gap={24}
                    alignItems="center"
                >
                    <Column gap={isBelowDesktop ? 16 : 24}>
                        <Column gap={isBelowLaptop ? 4 : 8}>
                            <Title isVerticalLayout={isVerticalLayout} />
                            <Description />
                        </Column>

                        <CTAButton onClick={handleCTAClick} isBelowLaptop={isBelowLaptop} />
                    </Column>

                    <Row height="100%" alignItems="flex-end">
                        <Image
                            image="DASHBOARD_PROMO_BANNER_STABLECOIN_YIELD"
                            height="100%"
                            objectFit="cover"
                            objectPosition="left"
                        />
                    </Row>
                </ContentFlex>
                <CloseButton onClose={onClose} />
            </Box>
        </AnimatedWrapper>
    );
};
