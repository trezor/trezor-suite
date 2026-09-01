import { useState } from 'react';
import { useDispatch } from 'react-redux';

import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useExternalLink } from '@suite/external-links';
import { setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { Box, Button, H2, Icon, IconButton, Image, Paragraph, Row } from '@trezor/components';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { AppleLogoIcon, LinuxLogoIcon, WindowsLogoIcon, XIcon } from '@trezor/icons';
import { SUITE_URL } from '@trezor/urls';

import { bannerAnimationConfig } from '../../dashboard/banner-animations';

const Container = styled(motion.div)`
    position: relative;
    border-radius: 12px;
    background: ${({ theme }) => theme.surfaceFillBrandDark};
    overflow: hidden;
    margin-bottom: 48px;
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
        color: ${({ theme }) => theme.contentOnDarkPrimary};
    }
`;

const OSIcons = styled.div`
    display: flex;
    align-self: center;
    align-items: center;
    gap: 6px;
`;

export const DesktopSuiteBanner = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
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
                    <Row alignItems="center" width="100%" margin={{ vertical: 12, horizontal: 20 }}>
                        <Box position={{ type: 'absolute', top: 16, right: 16 }} cursor="pointer">
                            <IconButton
                                icon={XIcon}
                                onClick={handleClose}
                                data-testid="@banner/install-desktop-suite/close-button"
                                intent="neutral"
                                priority="secondary"
                                isInverse
                                tooltip={{ content: <Translation id="TR_CLOSE" /> }}
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
                                        payload: { placement: 'settings' },
                                    })
                                }
                            >
                                <Translation id="TR_DESKTOP_APP_PROMO_GET" />
                            </Button>

                            <OSIcons>
                                <Icon as={AppleLogoIcon} intent="brand" />
                                <Icon as={LinuxLogoIcon} intent="brand" />
                                <Icon as={WindowsLogoIcon} intent="brand" size={20} />
                            </OSIcons>
                        </Content>
                    </Row>
                </Container>
            )}
        </AnimatePresence>
    );
};
