import { useState } from 'react';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, H2, Icon, Image, Paragraph, motionEasing } from '@trezor/components';
import { analytics, EventType } from '@trezor/suite-analytics';
import { SUITE_URL } from '@trezor/urls';

import { useDispatch } from 'src/hooks/suite/useDispatch';
import { setFlag } from 'src/actions/suite/suiteActions';
import { Translation, TrezorLink } from 'src/components/suite';

const Container = styled(motion.div)`
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: 160px;
    margin-bottom: 40px;
    padding: 12px 20px;
    border-radius: 12px;
    background: ${({ theme }) => theme.BG_GREEN};
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
        fill: ${({ theme }) => theme.BG_WHITE};
    }

    :hover {
        background: ${({ theme }) => theme.BG_GREEN_HOVER};
        opacity: 0.7;
    }

    :active {
        opacity: 0.9;
    }
`;

const StyledImage = styled(Image)`
    margin-right: 24px;
`;

const Content = styled.div`
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 16px 28px;
`;

const TextContainer = styled.div`
    grid-column: 1/3;

    * {
        color: ${({ theme }) => theme.TYPE_WHITE};
    }
`;

const StyledButton = styled(Button)`
    background: ${({ theme }) => theme.BG_WHITE};
    color: ${({ theme }) => theme.TYPE_GREEN};
    transition: opacity 0.2s;

    :hover,
    :focus {
        background: ${({ theme }) => theme.BG_WHITE};
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
        fill: ${({ theme }) => theme.BG_WHITE};
    }
`;

export const DesktopSuiteBanner = () => {
    const [isVisible, setIsVisible] = useState(true);

    const dispatch = useDispatch();

    const handleClose = () => {
        setIsVisible(false);
    };

    const animationConfig = {
        initial: { opacity: 1, transform: 'scale(1)', marginBottom: 40, height: 160 },
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
                        icon="CROSS"
                        onClick={handleClose}
                        data-test="@banner/install-desktop-suite/close-button"
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
                            <Icon icon="OS_MAC" />
                            <Icon icon="OS_LINUX" />
                            <Icon icon="OS_WINDOWS" size={20} />
                        </OSIcons>
                    </Content>
                </Container>
            )}
        </AnimatePresence>
    );
};
