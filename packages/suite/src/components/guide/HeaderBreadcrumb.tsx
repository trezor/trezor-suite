import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import type { GuideCategory } from '@suite-common/suite-types';
import { Row, Text, TextButton } from '@trezor/components';

import { openNode, setView } from 'src/actions/suite/guideActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';
import { findAncestorNodes, getNodeTitle } from 'src/utils/suite/guide';

export const HeaderBreadcrumb = () => {
    const analytics = useAnalytics();
    const language = useSelector(selectLanguage);
    const indexNode = useSelector(state => state.guide.indexNode);
    const currentNode = useSelector(state => state.guide.currentNode);
    const dispatch = useDispatch();

    const goToDashboard = () => dispatch(setView('GUIDE_DEFAULT'));

    // if no parent available, offer navigation to guide dashboard
    const FallbackBreadcrumb = (
        <TextButton
            onClick={goToDashboard}
            size="small"
            isUnderlined
            intent="neutral"
            data-testid="@guide/header-breadcrumb/dashboard-link"
        >
            <Translation id="TR_GUIDE_DASHBOARD" />
        </TextButton>
    );

    if (!currentNode || !indexNode) return FallbackBreadcrumb;

    const parentNodes = findAncestorNodes(currentNode, indexNode).filter(
        node => node.type === 'category',
    ) as GuideCategory[];

    if (!parentNodes.length) return FallbackBreadcrumb;

    const navigateToCategory = (node: GuideCategory) => {
        dispatch(openNode(node));
        analytics.report({
            type: events.guideHeaderNavigationEvent.name,
            payload: {
                type: 'category',
                id: node.id,
            },
        });
    };

    const navigateToGuideDashboard = () => {
        dispatch(setView('GUIDE_DEFAULT'));
        analytics.report({
            type: events.guideHeaderNavigationEvent.name,
            payload: {
                type: 'category',
                id: '/',
            },
        });
    };

    // If page is part of level 1 category, breadcrumb should consist of Dashboard / Category Level 1
    // If page is part of level 2 category, breadcrumb should consist of Category Level 1 / Category Level 2
    const parentNode = parentNodes.pop();
    const grandParentNode = parentNodes.pop();

    return (
        <Row gap={4}>
            <TextButton
                onClick={() => {
                    if (grandParentNode) {
                        navigateToCategory(grandParentNode);
                    } else {
                        navigateToGuideDashboard();
                    }
                }}
                size="small"
                isUnderlined
                intent="neutral"
                data-testid="@guide/header-breadcrumb/previous-category-link"
            >
                {grandParentNode ? (
                    getNodeTitle(grandParentNode, language)
                ) : (
                    <Translation id="TR_GUIDE_DASHBOARD" />
                )}
            </TextButton>
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                /
            </Text>
            <TextButton
                onClick={() => {
                    if (grandParentNode) {
                        navigateToCategory(grandParentNode);
                    } else if (parentNode) {
                        navigateToCategory(parentNode);
                    }
                }}
                data-testid="@guide/header-breadcrumb/category-link"
                size="small"
                isUnderlined
                intent="brand"
            >
                {parentNode && getNodeTitle(parentNode, language)}
            </TextButton>
        </Row>
    );
};
