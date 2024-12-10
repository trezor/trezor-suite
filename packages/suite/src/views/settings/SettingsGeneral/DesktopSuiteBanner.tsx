import { useState } from 'react';

import styled from 'styled-components';
import { AnimatePresence, HTMLMotionProps, motion } from 'framer-motion';

import {
    Button,
    H2,
    Icon,
    IconButton,
    Image,
    Paragraph,
    motionEasing,
    Box,
} from '@trezor/components';
import { analytics, EventType } from '@trezor/suite-analytics';
import { SUITE_URL } from '@trezor/urls';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';

import { useDispatch } from 'src/hooks/suite/useDispatch';
import { setFlag } from 'src/actions/suite/suiteActions';
import { Translation } from 'src/components/suite';

import { useExternalLink } from '../../../hooks/suite';

const Container = styled(motion.div)`
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    padding: 12px 20px;
    border-radius: 12px;
    background: ${({ theme }) => theme.legacy.BG_GREEN};
    overflow: hidden;
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
        color: ${({ theme }) => theme.legacy.TYPE_WHITE};
    }
`;

const OSIcons = styled.div`
    display: flex;
    align-self: center;
    align-items: center;
    gap: 6px;
    opacity: 0.7;

    path {
        fill: ${({ theme }) => theme.legacy.BG_WHITE};
    }
`;

export const DesktopSuiteBanner = () => {
    const [isVisible, setIsVisible] = useState(true);

    const dispatch = useDispatch();
    const href = useExternalLink(SUITE_URL);
    const handleClose = () => {
        setIsVisible(false);
    };

    const animationConfig: HTMLMotionProps<'div'> = {
        initial: { opacity: 1, transform: 'scale(1)', height: 'auto' },
        exit: { opacity: 0, transform: 'scale(0.7)', marginBottom: -60, height: 60 },
        transition: {
            duration: 0.33,
            ease: motionEasing.transition,
            height: {
                duration: 0.23,
                ease: motionEasing.transition,
            },
            opacity: {
                duration: 0.23,
                ease: motionEasing.transition,
            },
        },
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <Container
                    key="container"
                    onAnimationComplete={() =>
                        dispatch(dispatch(setFlag('showSettingsDesktopAppPromoBanner', false)))
                    }
                    {...animationConfig}
                >
                    <Box position={{ type: 'absolute', top: 16, right: 16 }} cursor="pointer">
                        <IconButton
                            icon="close"
                            onClick={handleClose}
                            data-testid="@banner/install-desktop-suite/close-button"
                            size="small"
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
                            variant="tertiary"
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
                            <Icon name="osMac" />
                            <Icon name="osLinux" />
                            <Icon name="osWindows" size={20} />
                        </OSIcons>
                    </Content>
                </Container>
            )}
        </AnimatePresence>
    );
};
