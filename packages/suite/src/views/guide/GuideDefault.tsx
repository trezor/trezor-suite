import React from 'react';
import { darken } from 'polished';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import * as guideActions from '@suite-actions/guideActions';
import { useActions, useAnalytics, useSelector } from '@suite-hooks';
import { Icon, variables, useTheme } from '@trezor/components';
import { Header, Content, ViewWrapper, GuideCategories } from '@guide-components';

const FeedbackLinkWrapper = styled.div`
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
    padding: 11px 14px;
`;

const FeedbackButton = styled.button`
    display: flex;
    align-items: center;
    width: 100%;
    border: 0;
    border-radius: 4px;
    cursor: pointer;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    text-align: left;
    padding: 11px;
    background: none;
    transition: ${props =>
        `background ${props.theme.HOVER_TRANSITION_TIME} ${props.theme.HOVER_TRANSITION_EFFECT}`};

    &:hover {
        background: ${props => darken(props.theme.HOVER_DARKEN_FILTER, props.theme.BG_WHITE)};
    }

    &:last-child {
        left: auto;
    }
`;

const FeedbackButtonLabel = styled.div`
    padding: 0 9px;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    width: 100%;
`;

const FeedbackButtonRightIcon = styled(Icon)`
    margin-top: -1px;
`;

const GuideDefault = (props: any) => {
    const analytics = useAnalytics();
    const theme = useTheme();

    const { setView } = useActions({
        setView: guideActions.setView,
    });
    const { indexNode } = useSelector(state => ({
        indexNode: state.guide.indexNode,
    }));

    return (
        <ViewWrapper {...props}>
            <Header label={<Translation id="TR_GUIDE_VIEW_HEADLINE_LEARN_AND_DISCOVER" />} />
            <Content>
                <GuideCategories
                    node={indexNode}
                    label={<Translation id="TR_GUIDE_CATEGORIES" />}
                />
            </Content>
            <FeedbackLinkWrapper
                onClick={() => {
                    setView('FEEDBACK_TYPE_SELECTION');
                    analytics.report({
                        type: 'guide/feedback/navigation',
                        payload: { type: 'overview' },
                    });
                }}
            >
                <FeedbackButton>
                    <Icon icon="FEEDBACK" size={16} color={theme.TYPE_LIGHT_GREY} />
                    <FeedbackButtonLabel>
                        <Translation id="TR_GUIDE_FEEDACK_OR_SUGGESTION" />
                    </FeedbackButtonLabel>
                    <FeedbackButtonRightIcon
                        icon="ARROW_RIGHT"
                        size={16}
                        color={theme.TYPE_LIGHT_GREY}
                    />
                </FeedbackButton>
            </FeedbackLinkWrapper>
        </ViewWrapper>
    );
};

export default GuideDefault;
