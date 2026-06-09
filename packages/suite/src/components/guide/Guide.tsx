import { useState } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { Box, Column, IconCircle } from '@trezor/components';

import { setView } from 'src/actions/suite/guideActions';
import {
    GuideCategories,
    GuideContent,
    GuideHeader,
    GuideSearch,
    GuideSectionHeadline,
    GuideViewWrapper,
} from 'src/components/guide';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { GuideItem } from './GuideItem';

export const Guide = () => {
    const [searchActive, setSearchActive] = useState(false);
    const indexNode = useSelector(state => state.guide.indexNode);
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
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
                    {!searchActive && (
                        <>
                            <Box>
                                <GuideSectionHeadline id="TR_GUIDE_HELP_TITLE" />
                                <GuideItem
                                    onClick={handleFeedbackButtonClick}
                                    data-testid="@guide/button-feedback"
                                    icon={<IconCircle name="lifebuoy" size={32} intent="neutral" />}
                                >
                                    <Translation id="TR_GUIDE_SUPPORT_AND_FEEDBACK" />
                                </GuideItem>
                            </Box>
                            <Box margin={{ top: 16 }}>
                                <GuideSectionHeadline id="TR_GUIDE_GUIDES_TITLE" />
                                <GuideCategories node={indexNode} />
                            </Box>
                        </>
                    )}
                </GuideContent>
            </Column>
        </GuideViewWrapper>
    );
};
