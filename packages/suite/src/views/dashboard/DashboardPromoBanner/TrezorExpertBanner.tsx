import styled, { useTheme } from 'styled-components';

import { resolveStaticPath } from '@suite-common/suite-utils';
import {
    Button,
    Column,
    IconButton,
    PNG_IMAGES,
    PNG_PATH,
    Row,
    SVG_IMAGES,
    SVG_PATH,
    Text,
} from '@trezor/components';
import { borders, colorVariants, spacings, spacingsPx } from '@trezor/theme';
import { DASHBOARD_BANNER_TEX_URL } from '@trezor/urls';

import { AnimatedWrapper } from './AnimatedWrapper';
import { Translation } from '../../../components/suite';
import { useExternalLink, useLayoutSize } from '../../../hooks/suite';

const underlineImage = resolveStaticPath(`${SVG_PATH}/${SVG_IMAGES.DASHBOARD_PROMO_UNDERLINE}`);
const mainImage = resolveStaticPath(`${PNG_PATH}/${PNG_IMAGES.TEX}`);

const Container = styled.div`
    height: 213px;
    padding-left: ${spacingsPx.xl};
    padding-right: ${spacingsPx.xl};
    background-color: ${({ theme }) => theme.baseFillSurfaceBrandDark};
`;

const CloseButtonContainer = styled.div`
    position: absolute;
    top: ${spacingsPx.sm};
    right: ${spacingsPx.sm};
    opacity: 0.5;

    &:hover {
        opacity: 1;
    }
`;

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
        <Button variant="primary" size="small" onClick={onClick} href={href}>
            <Translation id="TR_PROMO_BANNER_DASHBOARD_TEX_BUTTON" />
        </Button>
    );
};

type TrezorExpertBannerProps = {
    onClose: () => void;
    onCTAClick: () => void;
    isVisible: boolean;
};

export const TrezorExpertBanner = ({ onClose, onCTAClick, isVisible }: TrezorExpertBannerProps) => {
    const { isBelowLaptop, isBelowDesktop } = useLayoutSize();

    return (
        <AnimatedWrapper isVisible={isVisible} flagToHide="showTEXDashboardPromoBanner">
            <Container>
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

                <CloseButtonContainer>
                    <IconButton size="small" icon="x" variant="tertiary" onClick={onClose} />
                </CloseButtonContainer>
            </Container>
        </AnimatedWrapper>
    );
};
