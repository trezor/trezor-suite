import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { Box, Button, Column, Image, Paragraph, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useDispatch, useLayoutSize } from 'src/hooks/suite';
import { ContentFlex, useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

import { AnimatedWrapper, CloseButton } from './CommonPromoBannerComponents';

type StablecoinYieldBannerProps = {
    onClose: () => void;
    onCTAClick: () => void;
    isVisible: boolean;
};

const ImageContainer = styled.div`
    height: 100%;
    display: flex;
    align-items: flex-end;
`;

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
                        right: isBelowDesktop ? undefined : spacings.xxxxl,
                    }}
                    justifyContent="space-between"
                    gap={spacings.xl}
                    alignItems="center"
                >
                    <Column gap={isBelowDesktop ? spacings.md : spacings.xl}>
                        <Column gap={isBelowLaptop ? spacings.xxs : spacings.xs}>
                            <Title isVerticalLayout={isVerticalLayout} />
                            <Description />
                        </Column>

                        <CTAButton onClick={handleCTAClick} isBelowLaptop={isBelowLaptop} />
                    </Column>

                    <ImageContainer>
                        <Image
                            image="DASHBOARD_PROMO_BANNER_STABLECOIN_YIELD"
                            height="100%"
                            objectFit="cover"
                            objectPosition="left"
                        />
                    </ImageContainer>
                </ContentFlex>
                <CloseButton onClose={onClose} />
            </Box>
        </AnimatedWrapper>
    );
};
