import styled, { useTheme } from 'styled-components';

import { resolveStaticPath } from '@suite-common/suite-utils';
import { Box, Column, IMAGES, IMAGES_PATH, NewButton, Row, Text } from '@trezor/components';
import { borders, colorVariants, spacings, spacingsPx } from '@trezor/theme';
import { DASHBOARD_BANNER_TEX_URL } from '@trezor/urls';

import { AnimatedWrapper, CloseButton } from './CommonPromoBannerComponents';
import { Translation } from '../../../components/suite/Translation';
import { useExternalLink, useLayoutSize } from '../../../hooks/suite';

const underlineImage = resolveStaticPath(
    `${IMAGES_PATH}/${IMAGES.DASHBOARD_PROMO_BANNER_UNDERLINE}`,
);
const mainImage = resolveStaticPath(`${IMAGES_PATH}/${IMAGES.DASHBOARD_PROMO_BANNER_TEX}`);

const StyledImage = styled.img`
    flex: 1;
    height: 100%;
    padding-top: ${spacingsPx.xs};
    padding-bottom: ${spacingsPx.sm};
    object-fit: cover;
    border-radius: ${borders.radii.md};
    max-width: 40%;
`;

const NextGenerationTextBlock = styled.span`
    color: ${colorVariants.standard.textOnPrimary};
`;

const UnderlinedBlock = styled(NextGenerationTextBlock)`
    white-space: nowrap;
    background-image: url(${underlineImage});
    display: inline-block;
    background-position: 0 100%;
    background-repeat: no-repeat;
    background-size: 100%;
    padding-bottom: ${spacingsPx.xs};
`;

const Title = () => {
    const theme = useTheme();
    const { isBelowLaptop } = useLayoutSize();

    return (
        <Text
            typographyStyle={isBelowLaptop ? 'titleSmall' : 'titleMedium'}
            color={theme.baseContentPrimaryInverse}
            flex="1"
        >
            <Translation
                id="TR_PROMO_BANNER_DASHBOARD_TEX_TITLE"
                values={{
                    rest: text => text,
                    underline: text => <UnderlinedBlock>{text}</UnderlinedBlock>,
                }}
                isNested={true}
            />
        </Text>
    );
};

const Description = () => {
    const theme = useTheme();
    const { isBelowDesktop } = useLayoutSize();

    return (
        <Text
            typographyStyle={isBelowDesktop ? 'callout' : 'titleSmall'}
            color={theme.baseContentBrandInverse}
        >
            <Translation id="TR_PROMO_BANNER_DASHBOARD_TEX_DESCRIPTION" />
        </Text>
    );
};

const CTAButton = ({ onClick }: { onClick: () => void }) => {
    const href = useExternalLink(DASHBOARD_BANNER_TEX_URL);

    return (
        <NewButton intent="brand" size="small" onClick={onClick} href={href}>
            <Translation id="TR_PROMO_BANNER_DASHBOARD_TEX_BUTTON" />
        </NewButton>
    );
};

type TrezorExpertBannerProps = {
    onClose: () => void;
    onCTAClick: () => void;
    isVisible: boolean;
};

export const TrezorExpertBanner = ({ onClose, onCTAClick, isVisible }: TrezorExpertBannerProps) => {
    const { isBelowLaptop, isBelowDesktop } = useLayoutSize();
    const theme = useTheme();

    return (
        <AnimatedWrapper isVisible={isVisible} flagToHide="showTEXDashboardPromoBanner">
            <Box
                height={213}
                padding={{ left: 24, right: 24 }}
                backgroundColor={theme.baseFillSurfaceBrandDark}
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

                    <StyledImage src={mainImage} alt="Trezor Expert" />
                </Row>

                <CloseButton onClose={onClose} />
            </Box>
        </AnimatedWrapper>
    );
};
