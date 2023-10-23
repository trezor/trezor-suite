import { useState } from 'react';
import { darken } from 'polished';
import styled, { useTheme } from 'styled-components';
import { analytics, EventType } from '@trezor/suite-analytics';
import { zIndices } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import { setView } from 'src/actions/suite/guideActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { Icon, variables } from '@trezor/components';
import {
    GuideHeader,
    GuideContent,
    GuideViewWrapper,
    GuideCategories,
    GuideSearch,
} from 'src/components/guide';

const FeedbackLinkWrapper = styled.div`
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    padding: 11px 14px;
`;

const FeedbackButton = styled.button`
    display: flex;
    align-items: center;
    width: 100%;
    border: 0;
    border-radius: 4px;
    cursor: pointer;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    text-align: left;
    padding: 11px;
    background: none;
    transition: ${({ theme }) =>
        `background ${theme.HOVER_TRANSITION_TIME} ${theme.HOVER_TRANSITION_EFFECT}`};

    /* speficy position and z-index so that GuideButton does not interfere */
    position: relative;
    z-index: ${zIndices.guide};

    :hover,
    :focus {
        background: ${({ theme }) => darken(theme.HOVER_DARKEN_FILTER, theme.BG_WHITE)};
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
    const indexNode = useSelector(state => state.guide.indexNode);
    const dispatch = useDispatch();

    const handleFeedbackButtonClick = () => {
        dispatch(setView('SUPPORT_FEEDBACK_SELECTION'));
        analytics.report({
            type: EventType.GuideFeedbackNavigation,
            payload: { type: 'overview' },
        });
    };

    return (
        <GuideViewWrapper>
            <GuideHeader label={<Translation id="TR_GUIDE_VIEW_HEADLINE_LEARN_AND_DISCOVER" />} />
            <GuideContent>
                <GuideSearch pageRoot={indexNode} setSearchActive={setSearchActive} />
                {!searchActive && (
                    <GuideCategories
                        node={indexNode}
                        label={<Translation id="TR_GUIDE_CATEGORIES" />}
                    />
                )}
            </GuideContent>
            <FeedbackLinkWrapper>
                <FeedbackButton
                    data-test="@guide/button-feedback"
                    onClick={handleFeedbackButtonClick}
                >
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
        </GuideViewWrapper>
    );
};
