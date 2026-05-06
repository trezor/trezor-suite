import { useState } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { Button, Column, Divider, TextButton } from '@trezor/components';

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

    const handleShortcutsClick = () => {
        dispatch(setView('KEYBOARD_SHORTCUTS'));
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
                    <Column gap={16} margin={16}>
                        <TextButton
                            onClick={handleShortcutsClick}
                            size="small"
                            intent="neutral"
                            priority="secondary"
                            data-testid="@guide/button-shortcuts"
                            width="100%"
                        >
                            <Translation id="TR_GUIDE_KEYBOARD_SHORTCUTS" />
                        </TextButton>
                        <Button
                            data-testid="@guide/button-feedback"
                            onClick={handleFeedbackButtonClick}
                            iconLeft="lifebuoy"
                            intent="neutral"
                            priority="secondary"
                            width="100%"
                        >
                            <Translation id="TR_GUIDE_SUPPORT_AND_FEEDBACK" />
                        </Button>
                    </Column>
                </div>
            </Column>
        </GuideViewWrapper>
    );
};
