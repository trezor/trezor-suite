import styled, { css, keyframes } from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { FreeFocusInside } from 'react-focus-lock';

import { variables, Backdrop } from '@trezor/components';
import { useOnce } from '@trezor/react-utils';
import { useSelector } from 'src/hooks/suite';
import {
    SupportFeedbackSelection,
    Guide,
    GuidePage,
    GuideCategory,
    Feedback,
} from 'src/components/guide';
import { useGuide, GUIDE_ANIMATION_DURATION_MS } from 'src/hooks/guide';
import { zIndices } from '@trezor/theme';

const fullHeightStyle = css`
    position: absolute;
    top: 0;
    right: 0;
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
    z-index: ${zIndices.guide};
    cursor: pointer;

    ${variables.SCREEN_QUERY.ABOVE_LAPTOP} {
        display: none;
    }
`;

const GuideWrapper = styled.div`
    max-width: 100vw;
    height: 100%;
    z-index: ${zIndices.guide};

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
    const activeView = useSelector(state => state.guide.view);

    const { isGuideOpen, closeGuide } = useGuide();

    // if guide is open, do not animate guide opening if transitioning between onboarding, welcome and suite layout
    const isFirstRender = useOnce(isGuideOpen, false);

    return (
        <FreeFocusInside>
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
                            {activeView === 'GUIDE_DEFAULT' && <Guide />}
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
        </FreeFocusInside>
    );
};
