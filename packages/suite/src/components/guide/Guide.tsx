import { useState } from 'react';

import styled from 'styled-components';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { Button, Column, Divider } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';

import { setView } from 'src/actions/suite/guideActions';
import {
    GuideCategories,
    GuideContent,
    GuideHeader,
    GuideNode,
    GuideSearch,
    GuideViewWrapper,
} from 'src/components/guide';
import { useGuideContextNodes } from 'src/hooks/guide';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

const FeedbackLinkWrapper = styled.div`
    padding: ${spacingsPx.md};
`;

const RecommendedArticles = styled.section`
    padding-bottom: ${spacingsPx.lg};
`;

const SectionHeading = styled.h3`
    ${typography['body-sm-strong']}
    color: ${({ theme }) => theme.contentSecondary};
    padding: 0 0 ${spacingsPx.sm};
`;

const Nodes = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${spacingsPx.sm};
`;

export const Guide = () => {
    const [searchActive, setSearchActive] = useState(false);
    const indexNode = useSelector(state => state.guide.indexNode);
    const contextNodes = useGuideContextNodes(indexNode);
    const dispatch = useDispatch();
    const analytics = useAnalytics();

    const hasContextNodes = contextNodes.length > 0;

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
                            {hasContextNodes && (
                                <RecommendedArticles>
                                    <SectionHeading>
                                        <Translation id="TR_RECOMMENDED" />
                                    </SectionHeading>
                                    <Nodes data-testid="@guide/recommended-nodes">
                                        {contextNodes.map(node => (
                                            <GuideNode key={node.id} node={node} />
                                        ))}
                                    </Nodes>
                                </RecommendedArticles>
                            )}
                            <GuideCategories node={indexNode} />
                        </>
                    )}
                </GuideContent>

                <div>
                    <Divider margin={{ bottom: 0, top: 0 }} />
                    <FeedbackLinkWrapper>
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
                    </FeedbackLinkWrapper>
                </div>
            </Column>
        </GuideViewWrapper>
    );
};
