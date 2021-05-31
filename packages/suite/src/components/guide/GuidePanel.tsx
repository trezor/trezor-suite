import React from 'react';
import { useSelector } from '@suite-hooks';
import styled from 'styled-components';
import { FeedbackTypeSelection, Feedback, GuideDefault, GuideArticle } from '@guide-views';

const Wrapper = styled.div`
    background: ${props => props.theme.BG_WHITE};
    display: flex;
    flex-direction: column;
`;

const ViewWrapper = styled.div`
    height: 100%;
    overflow-y: auto;
`;

const GuidePanel = (props: any) => {
    const { activeView } = useSelector(state => ({
        activeView: state.guide.view,
    }));

    return (
        <Wrapper {...props}>
            <ViewWrapper>
                {activeView === 'GUIDE_DEFAULT' && <GuideDefault />}
                {activeView === 'GUIDE_ARTICLE' && <GuideArticle />}
                {activeView === 'FEEDBACK_TYPE_SELECTION' && <FeedbackTypeSelection />}
                {activeView === 'FEEDBACK_BUG' && <Feedback type="BUG" />}
                {activeView === 'FEEDBACK_SUGGESTION' && <Feedback type="SUGGESTION" />}
            </ViewWrapper>
        </Wrapper>
    );
};

export default GuidePanel;
