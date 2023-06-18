import React, { useState } from 'react';
import { darken } from 'polished';
import styled from 'styled-components';
import { analytics, EventType } from '@trezor/suite-analytics';

import { Translation } from 'src/components/suite';
import * as guideActions from 'src/actions/suite/guideActions';
import { useActions, useSelector } from 'src/hooks/suite';
import { Icon, variables, useTheme } from '@trezor/components';
import { Header, Content, ViewWrapper, GuideCategories, GuideSearch } from 'src/components/guide';

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

    :hover,
    :focus {
        background: ${props => darken(props.theme.HOVER_DARKEN_FILTER, props.theme.BG_WHITE)};
    }

    :last-child {
        left: auto;
    }
`;

const FeedbackButtonLabel = styled.div`
    padding: 0 9px;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    width: 100%;
    white-space: nowrap;
`;

const FeedbackButtonRightIcon = styled(Icon)`
    margin-top: -1px;
`;

export const GuideDefault = () => {
    const theme = useTheme();
    const [searchActive, setSearchActive] = useState(false);

    const { setView } = useActions({
        setView: guideActions.setView,
    });
    const { indexNode } = useSelector(state => ({
        indexNode: state.guide.indexNode,
    }));

    return (
        <ViewWrapper>
            <Header label={<Translation id="TR_GUIDE_VIEW_HEADLINE_LEARN_AND_DISCOVER" />} />
            <Content>
                <GuideSearch pageRoot={indexNode} setSearchActive={setSearchActive} />
                {!searchActive && (
                    <GuideCategories
                        node={indexNode}
                        label={<Translation id="TR_GUIDE_CATEGORIES" />}
                    />
                )}
            </Content>
            <FeedbackLinkWrapper
                onClick={() => {
                    setView('SUPPORT_FEEDBACK_SELECTION');
                    analytics.report({
                        type: EventType.GuideFeedbackNavigation,
                        payload: { type: 'overview' },
                    });
                }}
            >
                <FeedbackButton data-test="@guide/button-feedback">
                    <Icon icon="FEEDBACK" size={16} color={theme.TYPE_LIGHT_GREY} />
                    <FeedbackButtonLabel>
                        <Translation id="TR_GUIDE_SUPPORT_AND_FEEDBACK" />
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
