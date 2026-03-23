import { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';

import { events } from '@suite/analytics';
import { setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { Box, Button, H2, Icon, IconButton, Image, Paragraph, Row } from '@trezor/components';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { spacings, spacingsPx } from '@trezor/theme';
import { SUITE_URL } from '@trezor/urls';

import { useDispatch } from 'src/hooks/suite/useDispatch';
import { useAnalytics } from 'src/support/useAnalytics';

import { useExternalLink } from '../../../hooks/suite';
import { bannerAnimationConfig } from '../../dashboard/banner-animations';

const Container = styled(motion.div)`
    position: relative;
    border-radius: 12px;
    background: ${({ theme }) => theme.baseFillSurfaceBrandDark};
    overflow: hidden;
    margin-bottom: ${spacingsPx.xxxxl};
`;

const ImageContainer = styled.div`
    margin-right: 24px;

    ${SCREEN_QUERY.BELOW_LAPTOP} {
        display: none;
    }
`;

const Content = styled.div`
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 16px 28px;
`;

const TextContainer = styled.div`
    grid-column: 1/3;

    * {
        color: ${({ theme }) => theme.baseContentPrimaryInverse};
    }
`;

const OSIcons = styled.div`
    display: flex;
    align-self: center;
    align-items: center;
    gap: 6px;
`;

export const DesktopSuiteBanner = () => {
    const analytics = useAnalytics();
    const [isVisible, setIsVisible] = useState(true);

    const dispatch = useDispatch();
    const href = useExternalLink(SUITE_URL);
    const handleClose = () => {
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <Container
                    key="container"
                    onAnimationComplete={() =>
                        dispatch(
                            dispatch(
                                setFlag({ key: 'showSettingsDesktopAppPromoBanner', value: false }),
                            ),
                        )
                    }
                    {...bannerAnimationConfig}
                >
                    <Row
                        alignItems="center"
                        width="100%"
                        margin={{ vertical: spacings.sm, horizontal: spacings.lg }}
                    >
                        <Box position={{ type: 'absolute', top: 16, right: 16 }} cursor="pointer">
                            <IconButton
                                icon="x"
                                onClick={handleClose}
                                data-testid="@banner/install-desktop-suite/close-button"
                                intent="neutral"
                                priority="secondary"
                                isInverse
                            />
                        </Box>

                        <ImageContainer>
                            <Image image="TREZOR_PATTERN" width={140} />
                        </ImageContainer>

                        <Content>
                            <TextContainer>
                                <H2>
                                    <Translation id="TR_DESKTOP_APP_PROMO_HEADING" />
                                </H2>
                                <Paragraph>
                                    <Translation id="TR_DESKTOP_APP_PROMO_TEXT" />
                                </Paragraph>
                            </TextContainer>

                            <Button
                                intent="brand"
                                href={href}
                                onClick={() =>
                                    analytics.report({
                                        type: events.promoDesktopEvent.name,
                                    })
                                }
                            >
                                <Translation id="TR_DESKTOP_APP_PROMO_GET" />
                            </Button>

                            <OSIcons>
                                <Icon name="appleLogo" intent="brand" />
                                <Icon name="linuxLogo" intent="brand" />
                                <Icon name="windowsLogo" intent="brand" size={20} />
                            </OSIcons>
                        </Content>
                    </Row>
                </Container>
            )}
        </AnimatePresence>
    );
};
