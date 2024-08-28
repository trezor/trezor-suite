import { useState } from 'react';
import styled from 'styled-components';
import { AnimatePresence, HTMLMotionProps, motion } from 'framer-motion';
import { Button, H2, Icon, Image, Paragraph, motionEasing } from '@trezor/components';
import { analytics, EventType } from '@trezor/suite-analytics';
import { SUITE_URL } from '@trezor/urls';

import { useDispatch } from 'src/hooks/suite/useDispatch';
import { setFlag } from 'src/actions/suite/suiteActions';
import { Translation, TrezorLink } from 'src/components/suite';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';

const Container = styled(motion.div)`
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    margin-bottom: 40px;
    padding: 12px 20px;
    border-radius: 12px;
    background: ${({ theme }) => theme.legacy.BG_GREEN};
    overflow: hidden;
`;

const CloseButton = styled(Icon)`
    position: absolute;
    right: 16px;
    top: 16px;
    width: auto;
    height: auto;
    padding: 4px;
    border-radius: 4px;
    transition:
        opacity 0.15s,
        background 0.15s;
    cursor: pointer;

    path {
        fill: ${({ theme }) => theme.legacy.BG_WHITE};
    }

    &:hover {
        background: ${({ theme }) => theme.legacy.BG_GREEN_HOVER};
        opacity: 0.7;
    }

    &:active {
        opacity: 0.9;
    }
`;

const StyledImage = styled(Image)`
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

const StyledButton = styled(Button)`
    background: ${({ theme }) => theme.legacy.BG_WHITE};
    color: ${({ theme }) => theme.legacy.TYPE_GREEN};
    transition: opacity 0.2s;

    &:hover,
    &:focus {
        background: ${({ theme }) => theme.legacy.BG_WHITE};
        opacity: 0.8;
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

    const handleClose = () => {
        setIsVisible(false);
    };

    const animationConfig: HTMLMotionProps<'div'> = {
        initial: { opacity: 1, transform: 'scale(1)', marginBottom: 40, height: 'auto' },
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
                    <CloseButton
                        size={18}
                        name="close"
                        onClick={handleClose}
                        data-testid="@banner/install-desktop-suite/close-button"
                    />

                    <StyledImage image="TREZOR_PATTERN" width={140} />

                    <Content>
                        <TextContainer>
                            <H2>
                                <Translation id="TR_DESKTOP_APP_PROMO_HEADING" />
                            </H2>
                            <Paragraph>
                                <Translation id="TR_DESKTOP_APP_PROMO_TEXT" />
                            </Paragraph>
                        </TextContainer>

                        <TrezorLink
                            href={SUITE_URL}
                            variant="nostyle"
                            onClick={() =>
                                analytics.report({
                                    type: EventType.GetDesktopApp,
                                })
                            }
                        >
                            <StyledButton>
                                <Translation id="TR_DESKTOP_APP_PROMO_GET" />
                            </StyledButton>
                        </TrezorLink>

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
