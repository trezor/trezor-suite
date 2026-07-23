import styled from 'styled-components';

import { useExternalLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { Box, Button, Column, IMAGES, IMAGES_PATH, Row, Text } from '@trezor/components';
import { resolveStaticPath } from '@trezor/env-utils';
import { DASHBOARD_BANNER_TEX_URL } from '@trezor/urls';

import { useLayoutSize } from 'src/hooks/suite';

import { CloseButton } from './CommonPromoBannerComponents';

const underlineImage = resolveStaticPath(
    `${IMAGES_PATH}/${IMAGES.DASHBOARD_PROMO_BANNER_UNDERLINE}`,
);
const mainImage = resolveStaticPath(`${IMAGES_PATH}/${IMAGES.DASHBOARD_PROMO_BANNER_TEX}`);

const StyledImage = styled.img`
    flex: 1;
    height: 100%;
    padding-top: 8px;
    padding-bottom: 12px;
    object-fit: cover;
    border-radius: 16px;
    max-width: 40%;
`;

const UnderlinedBlock = styled.span`
    white-space: nowrap;
    background-image: url(${underlineImage});
    display: inline-block;
    background-position: 0 100%;
    background-repeat: no-repeat;
    background-size: 100%;
    padding-bottom: 8px;
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
};

export const TrezorExpertBanner = ({ onClose, onCTAClick }: TrezorExpertBannerProps) => {
    const { isBelowLaptop, isBelowDesktop } = useLayoutSize();

    return (
        <Box
            height={213}
            padding={{ horizontal: 24 }}
            backgroundColor="surfaceFillBrandDark"
            data-testid="@dashboard/promo-banner/trezor-expert"
        >
            <Row
                height="100%"
                margin={{ right: isBelowDesktop ? undefined : 48 }}
                justifyContent="space-between"
                gap={24}
                alignItems="center"
            >
                <Column gap={isBelowDesktop ? 16 : 24}>
                    <Column gap={isBelowLaptop ? 4 : 8}>
                        <Title />
                        <Description />
                    </Column>

                    <CTAButton onClick={onCTAClick} />
                </Column>

                <StyledImage src={mainImage} alt="Trezor Expert" />
            </Row>

            <CloseButton onClose={onClose} isInverse />
        </Box>
    );
};
