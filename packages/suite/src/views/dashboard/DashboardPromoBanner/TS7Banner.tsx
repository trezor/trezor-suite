import styled, { useTheme } from 'styled-components';

import { Box, Column, Image, NewButton, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { DASHBOARD_BANNER_TS7_URL } from '@trezor/urls';

import { AnimatedWrapper, CloseButton } from './CommonPromoBannerComponents';
import { Translation } from '../../../components/suite/Translation';
import { useExternalLink, useLayoutSize } from '../../../hooks/suite';

type TS7BannerProps = {
    onClose: () => void;
    onCTAClick: () => void;
    isVisible: boolean;
};

export const ImageContainer = styled.div`
    height: 100%;
    display: flex;
    align-items: flex-end;
`;

const Title = () => {
    const { isBelowLaptop } = useLayoutSize();

    return (
        <Text typographyStyle={isBelowLaptop ? 'titleSmall' : 'titleMedium'} flex="1">
            <Translation id="TR_PROMO_BANNER_DASHBOARD_TS7_TITLE" />
        </Text>
    );
};

const Description = () => {
    const { isBelowDesktop } = useLayoutSize();

    return (
        <Text typographyStyle={isBelowDesktop ? 'callout' : 'titleSmall'}>
            <Translation id="TR_PROMO_BANNER_DASHBOARD_TS7_DESCRIPTION" />
        </Text>
    );
};

const CTAButton = ({ onClick }: { onClick: () => void }) => {
    const href = useExternalLink(DASHBOARD_BANNER_TS7_URL);

    return (
        <NewButton intent="brand" onClick={onClick} href={href}>
            <Translation id="TR_PROMO_BANNER_DASHBOARD_TS7_BUTTON" />
        </NewButton>
    );
};

export const TS7Banner = ({ onClose, onCTAClick, isVisible }: TS7BannerProps) => {
    const { isBelowLaptop, isBelowDesktop } = useLayoutSize();
    const theme = useTheme();

    return (
        <AnimatedWrapper isVisible={isVisible} flagToHide="showTS7DashboardPromoBanner">
            <Box
                height={213}
                padding={{ left: 24, right: 24 }}
                backgroundColor={theme.backgroundTertiaryDefaultOnElevation0}
            >
                <Row
                    height="100%"
                    margin={{ right: isBelowDesktop ? undefined : spacings.xxxxl }}
                    justifyContent="space-between"
                    gap={spacings.xl}
                    alignItems="center"
                >
                    <Column gap={isBelowDesktop ? spacings.md : spacings.xl}>
                        <Column gap={isBelowLaptop ? spacings.xxs : spacings.xs}>
                            <Title />
                            <Description />
                        </Column>

                        <CTAButton onClick={onCTAClick} />
                    </Column>

                    <ImageContainer>
                        <Image image="DASHBOARD_PROMO_BANNER_T3W1" maxHeight="90%" />
                    </ImageContainer>
                </Row>
                <CloseButton onClose={onClose} />
            </Box>
        </AnimatedWrapper>
    );
};
