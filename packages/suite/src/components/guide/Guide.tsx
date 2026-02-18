import { useState } from 'react';

import styled from 'styled-components';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { Column, Divider, Icon } from '@trezor/components';
import { spacingsPx, transitions, typography, zIndices } from '@trezor/theme';

import { setView } from 'src/actions/suite/guideActions';
import {
    GuideCategories,
    GuideContent,
    GuideHeader,
    GuideSearch,
    GuideViewWrapper,
} from 'src/components/guide';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

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
    transition: background ${transitions.speed.normal} ${transitions.type};

    /* speficy position and z-index so that GuideButton does not interfere */
    position: relative;
    z-index: ${zIndices.guide};

    &:hover,
    &:focus {
        background: ${({ theme }) => theme.backgroundTertiaryPressedOnElevation1};
    }

    &:last-child {
        left: auto;
    }
`;

const FeedbackButtonLabel = styled.div`
    padding: 0 9px;
    ${typography['body-md']}
    width: 100%;
    white-space: nowrap;
`;

const FeedbackIconWrapper = styled.div`
    position: relative;
    top: -1px;
`;

export const Guide = () => {
    const [searchActive, setSearchActive] = useState(false);
    const indexNode = useSelector(state => state.guide.indexNode);
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const handleFeedbackButtonClick = () => {
        dispatch(setView('SUPPORT_FEEDBACK_SELECTION'));
        analytics.report({
            type: events.guideFeedbackNavigationEvent.name,
            payload: { type: 'overview' },
        });
    };

    return (
        <GuideViewWrapper>
            <GuideHeader label={<Translation id="TR_GUIDE_VIEW_HEADLINE_LEARN_AND_DISCOVER" />} />
            <Column justifyContent="space-between" height="100%">
                <GuideContent>
                    <GuideSearch pageRoot={indexNode} setSearchActive={setSearchActive} />
                    {!searchActive && <GuideCategories node={indexNode} />}
                </GuideContent>

                <div>
                    <Divider margin={{ bottom: 0, top: 0 }} />
                    <FeedbackLinkWrapper>
                        <FeedbackButton
                            data-testid="@guide/button-feedback"
                            onClick={handleFeedbackButtonClick}
                        >
                            <Icon name="users" size={24} color="iconOnTertiary" />
                            <FeedbackButtonLabel>
                                <Translation id="TR_GUIDE_SUPPORT_AND_FEEDBACK" />
                            </FeedbackButtonLabel>
                            <FeedbackIconWrapper>
                                <Icon name="caretCircleRight" size={24} intent="brand" />
                            </FeedbackIconWrapper>
                        </FeedbackButton>
                    </FeedbackLinkWrapper>
                </div>
            </Column>
        </GuideViewWrapper>
    );
};
