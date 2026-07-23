import styled from 'styled-components';

import { useExternalLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { Box, Button, Column, Image, Paragraph, Text } from '@trezor/components';
import { DASHBOARD_BANNER_TS7_URL } from '@trezor/urls';

import { useLayoutSize } from 'src/hooks/suite';
import { ContentFlex, useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

import { CloseButton } from './CommonPromoBannerComponents';

type TS7BannerProps = {
    onClose: () => void;
    onCTAClick: () => void;
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

export const TS7Banner = ({ onClose, onCTAClick }: TS7BannerProps) => {
    const { isBelowLaptop, isBelowDesktop } = useLayoutSize();
    const isVerticalLayout = useIsContentBelowBreakpoint();

    return (
        <Box
            height={isVerticalLayout ? undefined : 213}
            padding={{ horizontal: 24, top: isVerticalLayout ? 16 : 0 }}
            backgroundColor="elementFillNeutralSofter"
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

                    <CTAButton onClick={onCTAClick} isBelowLaptop={isBelowLaptop} />
                </Column>

                <ImageContainer>
                    <Image image="DASHBOARD_PROMO_BANNER_T3W1" maxHeight="90%" />
                </ImageContainer>
            </ContentFlex>
            <CloseButton onClose={onClose} />
        </Box>
    );
};
