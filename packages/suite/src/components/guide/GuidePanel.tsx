import React, { useEffect } from 'react';
import styled from 'styled-components';

import * as guideActions from '@suite-actions/guideActions';
import { useSelector, useActions } from '@suite-hooks';
import {
    FeedbackTypeSelection,
    GuideDefault,
    GuidePage,
    GuideCategory,
    Feedback,
} from '@guide-views';

import type { Category } from '@suite-types/guide';

const Wrapper = styled.div`
    background: ${props => props.theme.BG_WHITE};
    display: flex;
    flex-direction: column;
`;

const ViewWrapper = styled.div`
    height: 100%;
    display: flex;
`;

type GuidePanelProps = {
    open?: boolean;
    className?: string;
};

const GuidePanel = (props: GuidePanelProps) => {
    const { activeView } = useSelector(state => ({
        activeView: state.guide.view,
    }));

    const { setIndexNode } = useActions({
        setIndexNode: guideActions.setIndexNode,
    });

    useEffect(() => {
        const loadGuideSetupFile = async () => {
            try {
                const indexNode = (await import(
                    '@trezor/suite-data/files/guide/index.json'
                )) as Category;

                setIndexNode(indexNode);
            } catch (e) {
                console.error(`Loading of guide setup file failed: ${e}`);
            }
        };
        loadGuideSetupFile();
    }, [setIndexNode]);

    return (
        <Wrapper {...props}>
            <ViewWrapper>
                {activeView === 'GUIDE_DEFAULT' && <GuideDefault />}
                {activeView === 'GUIDE_PAGE' && <GuidePage />}
                {activeView === 'GUIDE_CATEGORY' && <GuideCategory />}
                {activeView === 'FEEDBACK_TYPE_SELECTION' && <FeedbackTypeSelection />}
                {activeView === 'FEEDBACK_BUG' && <Feedback type="BUG" />}
                {activeView === 'FEEDBACK_SUGGESTION' && <Feedback type="SUGGESTION" />}
            </ViewWrapper>
        </Wrapper>
    );
};

export default GuidePanel;
