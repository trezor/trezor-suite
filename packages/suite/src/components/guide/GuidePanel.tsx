import React, { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';

import { variables } from '@trezor/components';
import { useSelector } from '@suite-hooks';
import {
    SupportFeedbackSelection,
    GuideDefault,
    GuidePage,
    GuideCategory,
    Feedback,
} from '@guide-views';
import { useGuide } from '@guide-hooks';

const GuideWrapper = styled.div<{ isModalOpen?: boolean }>`
    z-index: ${variables.Z_INDEX.GUIDE_PANEL};
    height: 100%;

    ${props =>
        props.isModalOpen &&
        css`
            z-index: ${variables.Z_INDEX.GUIDE_PANEL_BESIDE_MODAL};
            top: 0;
            right: 0;
            position: absolute;
        `}
`;

const MotionGuide = styled(motion.div)`
    height: 100%;
    border-left: 1px solid ${props => props.theme.STROKE_GREY};
    display: flex;
`;

type GuidePanelProps = {
    className?: string;
};

const GuidePanel = (props: GuidePanelProps) => {
    const { activeView } = useSelector(state => ({
        activeView: state.guide.view,
    }));

    const { guideOpen, isModalOpen } = useGuide();

    // if guide is open, do not animate guide opening if transitioning between onboarding, welcome and suite layout
    const [guideAlreadyOpen, setGuideAlreadyOpen] = useState(guideOpen);
    useEffect(() => {
        setGuideAlreadyOpen(false);
    }, []);

    return (
        <GuideWrapper isModalOpen={isModalOpen}>
            <AnimatePresence>
                {guideOpen && (
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
                            transition: { duration: 0.3, bounce: 0 },
                        }}
                        exit={{
                            width: 0,
                            transition: { duration: 0.3, bounce: 0 },
                        }}
                        {...props}
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
    );
};

export default GuidePanel;
