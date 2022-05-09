import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import FocusLock from 'react-focus-lock';

import { variables, Backdrop } from '@trezor/components';
import { useOnce, useSelector } from '@suite-hooks';
import {
    SupportFeedbackSelection,
    GuideDefault,
    GuidePage,
    GuideCategory,
    Feedback,
} from '@guide-components';
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

const StyledBackdrop = styled(Backdrop)`
    animation: ${smoothBlur} 0.3s ease-in forwards;
    z-index: ${variables.Z_INDEX.GUIDE_PANEL_BESIDE_MODAL};
    cursor: pointer;

    ${variables.SCREEN_QUERY.ABOVE_LAPTOP} {
        display: none;
    }
`;

const GuideWrapper = styled.div`
    max-width: 100vw;
    height: 100%;
    z-index: ${variables.Z_INDEX.GUIDE_PANEL};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        ${fullHeightStyle}
    }
`;

const MotionGuide = styled(motion.div)`
    max-width: 100vw;
    height: 100%;
    border-left: 1px solid ${({ theme }) => theme.STROKE_GREY};
    display: flex;
    overflow-x: hidden;
`;

export const GuidePanel = () => {
    const { activeView } = useSelector(state => ({
        activeView: state.guide.view,
    }));

    const { isGuideOpen, isGuideOnTop, isModalOpen, closeGuide } = useGuide();

    // if guide is open, do not animate guide opening if transitioning between onboarding, welcome and suite layout
    const isFirstRender = useOnce(isGuideOpen, false);

    return (
        <FocusLock
            disabled={!isGuideOpen || (!isGuideOnTop && !isModalOpen)}
            group="overlay"
            autoFocus={false}
        >
            {isGuideOpen && <StyledBackdrop onClick={closeGuide} />}

            <GuideWrapper>
                <AnimatePresence>
                    {isGuideOpen && (
                        <MotionGuide
                            data-test="@guide/panel"
                            initial={{
                                width: isFirstRender ? variables.LAYOUT_SIZE.GUIDE_PANEL_WIDTH : 0,
                            }}
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
