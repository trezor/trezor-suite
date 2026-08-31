import { useState } from 'react';
import { useDispatch } from 'react-redux';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { Box, Column, IconCircle, useMediaQuery } from '@trezor/components';
import { CommandIcon, LifebuoyIcon } from '@trezor/icons';

import { setView } from 'src/actions/suite/guideActions';
import {
    GuideCategories,
    GuideContent,
    GuideHeader,
    GuideSearch,
    GuideSectionHeadline,
    GuideViewWrapper,
} from 'src/components/guide';
import { useSelector } from 'src/hooks/suite';

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

    const handleShortcutsClick = () => {
        dispatch(setView('KEYBOARD_SHORTCUTS'));
    };

    // Keyboard shortcuts are irrelevant on touch devices without a physical keyboard.
    const isTouchDevice = useMediaQuery('(hover: none) and (pointer: coarse)');

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
                                <Column gap={8}>
                                    <GuideItem
                                        onClick={handleFeedbackButtonClick}
                                        data-testid="@guide/button-feedback"
                                        icon={
                                            <IconCircle
                                                icon={LifebuoyIcon}
                                                size={32}
                                                intent="neutral"
                                            />
                                        }
                                    >
                                        <Translation id="TR_GUIDE_HELP_AND_FEEDBACK" />
                                    </GuideItem>
                                </Column>
                            </Box>
                            <Box margin={{ top: 16 }}>
                                <GuideSectionHeadline id="TR_GUIDE_GUIDES_TITLE" />
                                <GuideCategories node={indexNode} />
                            </Box>
                        </>
                    )}
                </GuideContent>
                {!isTouchDevice && (
                    <Box padding={16}>
                        <GuideItem
                            onClick={handleShortcutsClick}
                            data-testid="@guide/button-shortcuts"
                            icon={<IconCircle icon={CommandIcon} size={32} intent="neutral" />}
                        >
                            <Translation id="TR_GUIDE_KEYBOARD_SHORTCUTS" />
                        </GuideItem>
                    </Box>
                )}
            </Column>
        </GuideViewWrapper>
    );
};
