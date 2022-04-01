import React, { useState, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import FocusLock from 'react-focus-lock';

import { variables } from '@trezor/components';
import { useSelector } from '@suite-hooks';
import {
    SupportFeedbackSelection,
    GuideDefault,
    GuidePage,
    GuideCategory,
    Feedback,
} from '@guide-views';
import { useGuide, GUIDE_ANIMATION_DURATION_MS } from '@guide-hooks';

const fullHeightStyle = css`
    position: absolute;
    top: 0;
    right: 0;
    z-index: ${variables.Z_INDEX.GUIDE_PANEL_BESIDE_MODAL};
`;

const smoothBlur = keyframes`
    from {
        backdrop-filter: blur(0px);
    }

    to {
        backdrop-filter: blur(3px);
    }
`;

const BackDrop = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.3);
    animation: ${smoothBlur} 0.3s ease-in forwards;
    z-index: ${variables.Z_INDEX.GUIDE_PANEL_BESIDE_MODAL};
    cursor: pointer;

    ${variables.SCREEN_QUERY.ABOVE_LAPTOP} {
        display: none;
    }
`;

const GuideWrapper = styled.div<{ isModalOpen?: boolean }>`
    max-width: 100vw;
    height: 100%;
    z-index: ${variables.Z_INDEX.GUIDE_PANEL};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        ${fullHeightStyle}
    }

    ${variables.SCREEN_QUERY.ABOVE_LAPTOP} {
        ${({ isModalOpen }) => isModalOpen && fullHeightStyle}
    }
`;

const MotionGuide = styled(motion.div)`
    max-width: 100vw;
    height: 100%;
    border-left: 1px solid ${({ theme }) => theme.STROKE_GREY};
    display: flex;
`;

export const GuidePanel: React.FC = () => {
    const { activeView } = useSelector(state => ({
        activeView: state.guide.view,
    }));

    const { isGuideOpen, isModalOpen, closeGuide } = useGuide();

    // if guide is open, do not animate guide opening if transitioning between onboarding, welcome and suite layout
    const [guideAlreadyOpen, setGuideAlreadyOpen] = useState(isGuideOpen);

    useEffect(() => {
        setGuideAlreadyOpen(false);
    }, []);

    return (
        <FocusLock disabled={!isGuideOpen} group="overlay" autoFocus={false}>
            {isGuideOpen && <BackDrop onClick={closeGuide} />}

            <GuideWrapper isModalOpen={isModalOpen}>
                <AnimatePresence>
                    {isGuideOpen && (
                        <MotionGuide
                            data-test="@guide/panel"
                            initial={
                                guideAlreadyOpen
                                    ? {
                                          width: variables.LAYOUT_SIZE.GUIDE_PANEL_WIDTH,
                                      }
                                    : { width: 0 }
                            }
                            animate={{
                                width: variables.LAYOUT_SIZE.GUIDE_PANEL_WIDTH,
                                transition: {
                                    duration: GUIDE_ANIMATION_DURATION_MS / 1000,
                                    bounce: 0,
                                },
                            }}
                            exit={{
                                width: 0,
                                transition: {
                                    duration: GUIDE_ANIMATION_DURATION_MS / 1000,
                                    bounce: 0,
                                },
                            }}
                        >
                            {activeView === 'GUIDE_DEFAULT' && <GuideDefault />}
                            {activeView === 'GUIDE_PAGE' && <GuidePage />}
                            {activeView === 'GUIDE_CATEGORY' && <GuideCategory />}
                            {activeView === 'SUPPORT_FEEDBACK_SELECTION' && (
                                <SupportFeedbackSelection />
                            )}
                            {activeView === 'FEEDBACK_BUG' && <Feedback type="BUG" />}
                            {activeView === 'FEEDBACK_SUGGESTION' && <Feedback type="SUGGESTION" />}
                        </MotionGuide>
                    )}
                </AnimatePresence>
            </GuideWrapper>
        </FocusLock>
    );
};
