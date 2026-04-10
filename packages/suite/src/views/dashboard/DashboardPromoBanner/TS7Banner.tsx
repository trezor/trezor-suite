import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { Box, Button, Column, Image, Paragraph, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { DASHBOARD_BANNER_TS7_URL } from '@trezor/urls';

import { useExternalLink, useLayoutSize } from 'src/hooks/suite';
import { ContentFlex, useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

import { AnimatedWrapper, CloseButton } from './CommonPromoBannerComponents';

type TS7BannerProps = {
    onClose: () => void;
    onCTAClick: () => void;
    isVisible: boolean;
    ['data-testid']?: string;
};

export const ImageContainer = styled.div`
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
            <Translation id="TR_PROMO_BANNER_DASHBOARD_TS7_TITLE" />
        </Paragraph>
    );
};

const Description = () => {
    const { isBelowDesktop } = useLayoutSize();

    return (
        <Text typographyStyle={isBelowDesktop ? 'body-sm-strong' : 'headline-sm'}>
            <Translation id="TR_PROMO_BANNER_DASHBOARD_TS7_DESCRIPTION" />
        </Text>
    );
};

const CTAButton = ({ onClick, isBelowLaptop }: { onClick: () => void; isBelowLaptop: boolean }) => {
    const href = useExternalLink(DASHBOARD_BANNER_TS7_URL);

    return (
        <Button
            intent="brand"
            onClick={onClick}
            size={isBelowLaptop ? 'medium' : 'large'}
            href={href}
            data-testid="@dashboard/promo-banner/ts7/button"
        >
            <Translation id="TR_PROMO_BANNER_DASHBOARD_TS7_BUTTON" />
        </Button>
    );
};

export const TS7Banner = ({ onClose, onCTAClick, isVisible }: TS7BannerProps) => {
    const { isBelowLaptop, isBelowDesktop } = useLayoutSize();
    const isVerticalLayout = useIsContentBelowBreakpoint();

    return (
        <AnimatedWrapper isVisible={isVisible} flagToHide="showTS7DashboardPromoBanner">
            <Box
                height={isVerticalLayout ? undefined : 213}
                padding={{ horizontal: 24, top: isVerticalLayout ? 16 : 0 }}
                backgroundColor="backgroundTertiaryDefaultOnElevation0"
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

                        <CTAButton onClick={onCTAClick} isBelowLaptop={isBelowLaptop} />
                    </Column>

                    <ImageContainer>
                        <Image image="DASHBOARD_PROMO_BANNER_T3W1" maxHeight="90%" />
                    </ImageContainer>
                </ContentFlex>
                <CloseButton onClose={onClose} />
            </Box>
        </AnimatedWrapper>
    );
};
