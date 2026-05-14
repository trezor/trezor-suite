import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { Box, Button, Column, IMAGES, IMAGES_PATH, Row, Text } from '@trezor/components';
import { resolveStaticPath } from '@trezor/env-utils';
import { borders, spacings, spacingsPx } from '@trezor/theme';
import { DASHBOARD_BANNER_TEX_URL } from '@trezor/urls';

import { useExternalLink, useLayoutSize } from 'src/hooks/suite';

import { AnimatedWrapper, CloseButton } from './CommonPromoBannerComponents';

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

const UnderlinedBlock = styled.span`
    white-space: nowrap;
    background-image: url(${underlineImage});
    display: inline-block;
    background-position: 0 100%;
    background-repeat: no-repeat;
    background-size: 100%;
    padding-bottom: ${spacingsPx.xs};
`;

const Title = () => {
    const { isBelowLaptop } = useLayoutSize();

    return (
        <Text
            typographyStyle={isBelowLaptop ? 'headline-sm' : 'headline-md'}
            color="contentOnDarkPrimary"
            flex="1"
        >
            <Translation
                id="TR_PROMO_BANNER_DASHBOARD_TEX_TITLE"
                values={{
                    rest: text => text,
                    underline: text => <UnderlinedBlock>{text}</UnderlinedBlock>,
                }}
            />
        </Text>
    );
};

const Description = () => {
    const { isBelowDesktop } = useLayoutSize();

    return (
        <Text
            typographyStyle={isBelowDesktop ? 'body-sm-strong' : 'headline-sm'}
            color="contentOnDarkBrand"
        >
            <Translation id="TR_PROMO_BANNER_DASHBOARD_TEX_DESCRIPTION" />
        </Text>
    );
};

const CTAButton = ({ onClick }: { onClick: () => void }) => {
    const href = useExternalLink(DASHBOARD_BANNER_TEX_URL);

    return (
        <Button
            intent="brand"
            onClick={onClick}
            href={href}
            data-testid="@dashboard/promo-banner/tex/button"
        >
            <Translation id="TR_PROMO_BANNER_DASHBOARD_TEX_BUTTON" />
        </Button>
    );
};

type TrezorExpertBannerProps = {
    onClose: () => void;
    onCTAClick: () => void;
    isVisible: boolean;
    ['data-testid']?: string;
};

export const TrezorExpertBanner = ({ onClose, onCTAClick, isVisible }: TrezorExpertBannerProps) => {
    const { isBelowLaptop, isBelowDesktop } = useLayoutSize();

    return (
        <AnimatedWrapper isVisible={isVisible} flagToHide="showTEXDashboardPromoBanner">
            <Box
                height={213}
                padding={{ horizontal: 24 }}
                backgroundColor="surfaceFillBrandDark"
                data-testid="@dashboard/promo-banner/trezor-expert"
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

                <CloseButton onClose={onClose} isInverse />
            </Box>
        </AnimatedWrapper>
    );
};
