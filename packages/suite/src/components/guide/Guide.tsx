import { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { analytics, EventType } from '@trezor/suite-analytics';
import { spacingsPx, typography, zIndices } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import { setView } from 'src/actions/suite/guideActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { Icon } from '@trezor/components';
import {
    GuideHeader,
    GuideContent,
    GuideViewWrapper,
    GuideCategories,
    GuideSearch,
} from 'src/components/guide';

const FeedbackBorder = styled.div`
    height: 1px;
    background-color: ${({ theme }) => theme.borderOnElevation0};
    margin: 0 ${spacingsPx.md};
`;
const FeedbackLinkWrapper = styled.div`
    padding: ${spacingsPx.md};
`;

const FeedbackButton = styled.button`
    display: flex;
    align-items: center;
    width: 100%;
    border: 0;
    border-radius: 4px;
    cursor: pointer;
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
        background: ${({ theme }) => theme.backgroundTertiaryPressedOnElevation1};
    }

    :last-child {
        left: auto;
    }
`;

const FeedbackButtonLabel = styled.div`
    padding: 0 9px;
    ${typography.body}
    width: 100%;
    white-space: nowrap;
`;

const FeedbackButtonRightIcon = styled(Icon)`
    margin-top: -1px;
`;

export const Guide = () => {
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
                {!searchActive && <GuideCategories node={indexNode} />}
            </GuideContent>
            <FeedbackBorder />
            <FeedbackLinkWrapper>
                <FeedbackButton
                    data-test="@guide/button-feedback"
                    onClick={handleFeedbackButtonClick}
                >
                    <Icon icon="USERS" size={24} color={theme.iconOnTertiary} />
                    <FeedbackButtonLabel>
                        <Translation id="TR_GUIDE_SUPPORT_AND_FEEDBACK" />
                    </FeedbackButtonLabel>
                    <FeedbackButtonRightIcon
                        icon="ARROW_RIGHT_CIRCLE"
                        size={24}
                        color={theme.iconPrimaryDefault}
                    />
                </FeedbackButton>
            </FeedbackLinkWrapper>
        </GuideViewWrapper>
    );
};
