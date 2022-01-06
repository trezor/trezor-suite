import React from 'react';
import styled, { css } from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';

import { variables } from '@trezor/components';
import { useSelector } from '@suite-hooks';
import {
    FeedbackTypeSelection,
    GuideDefault,
    GuidePage,
    GuideCategory,
    Feedback,
} from '@guide-views';
import { MODAL } from '@suite-actions/constants';

const GuideWrapper = styled.div<{ isModalOpen?: boolean }>`
    z-index: 11;
    height: 100%;

    @media (max-width: ${variables.SCREEN_SIZE.MD}) {
        display: none;
    }

    ${props =>
        props.isModalOpen &&
        css`
            z-index: 10001;
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
    const { activeView, guideOpen, isModalOpen } = useSelector(state => ({
        activeView: state.guide.view,
        guideOpen: state.guide.open,
        // 2 types of modals exist. 1. redux 'modal' based, 2. redux 'router' based
        isModalOpen:
            state.modal.context !== MODAL.CONTEXT_NONE || state.router.route?.isForegroundApp,
    }));

    return (
        <GuideWrapper isModalOpen={isModalOpen}>
            <AnimatePresence>
                {guideOpen && (
                    <MotionGuide
                        data-test="@guide/panel"
                        initial={{ width: 0 }}
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
                        {activeView === 'FEEDBACK_TYPE_SELECTION' && <FeedbackTypeSelection />}
                        {activeView === 'FEEDBACK_BUG' && <Feedback type="BUG" />}
                        {activeView === 'FEEDBACK_SUGGESTION' && <Feedback type="SUGGESTION" />}
                    </MotionGuide>
                )}
            </AnimatePresence>
        </GuideWrapper>
    );
};

export default GuidePanel;
