import { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';

import { Box, Button, H2, Icon, IconButton, Image, Paragraph, Row } from '@trezor/components';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings, spacingsPx } from '@trezor/theme';
import { SUITE_URL } from '@trezor/urls';

import { setFlag } from 'src/actions/suite/suiteActions';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite/useDispatch';

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
    opacity: 0.7;
`;

export const DesktopSuiteBanner = () => {
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
                        dispatch(dispatch(setFlag('showSettingsDesktopAppPromoBanner', false)))
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
                                size="small"
                                variant="tertiary"
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
                                variant="primary"
                                href={href}
                                onClick={() =>
                                    analytics.report({
                                        type: EventType.GetDesktopApp,
                                    })
                                }
                            >
                                <Translation id="TR_DESKTOP_APP_PROMO_GET" />
                            </Button>

                            <OSIcons>
                                <Icon name="appleLogo" variant="primary" />
                                <Icon name="linuxLogo" variant="primary" />
                                <Icon name="windowsLogo" variant="primary" size={20} />
                            </OSIcons>
                        </Content>
                    </Row>
                </Container>
            )}
        </AnimatePresence>
    );
};
