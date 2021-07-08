import React from 'react';
import styled from 'styled-components';
import { darken } from 'polished';

import { useActions, useSelector, useAnalytics } from '@suite-hooks';
import * as guideActions from '@suite-actions/guideActions';
import { variables } from '@trezor/components';
import { Translation } from '@suite-components';
import { findAncestorNodes, getNodeTitle } from '@suite-utils/guide';

import type { Category } from '@suite-types/guide';

const BreadcrumbWrapper = styled.span`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const PreviousCategoryLink = styled.a`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    transition: ${props =>
        `background ${props.theme.HOVER_TRANSITION_TIME} ${props.theme.HOVER_TRANSITION_EFFECT}`};

    &:hover {
        color: ${props => darken(props.theme.HOVER_DARKEN_FILTER, props.theme.TYPE_LIGHT_GREY)};
    }
`;

const BreadcrumbDelimiter = styled.span`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin: 0 5px;
`;

const CategoryLink = styled.a`
    color: ${props => props.theme.TYPE_GREEN};
    transition: ${props =>
        `background ${props.theme.HOVER_TRANSITION_TIME} ${props.theme.HOVER_TRANSITION_EFFECT}`};

    &:hover {
        color: ${props => darken(props.theme.HOVER_DARKEN_FILTER, props.theme.TYPE_GREEN)};
    }
`;

const HeaderBreadcrumb = () => {
    const analytics = useAnalytics();

    const { language, indexNode, currentNode } = useSelector(state => ({
        language: state.suite.settings.language,
        indexNode: state.guide.indexNode,
        currentNode: state.guide.currentNode,
    }));

    const { setView, openNode } = useActions({
        setView: guideActions.setView,
        openNode: guideActions.openNode,
    });

    // if no parent available, offer navigation to guide dashboard
    const fallbackBreadcrumb = (
        <BreadcrumbWrapper>
            <CategoryLink onClick={() => setView('GUIDE_DEFAULT')}>
                <Translation id="TR_GUIDE_DASHBOARD" />
            </CategoryLink>
        </BreadcrumbWrapper>
    );

    if (!currentNode || !indexNode) return fallbackBreadcrumb;

    const parentNodes = findAncestorNodes(currentNode, indexNode).filter(
        node => node.type === 'category',
    ) as Category[];

    if (!parentNodes.length) return fallbackBreadcrumb;

    const navigateToCategory = (node: Category) => {
        openNode(node);
        analytics.report({
            type: 'guide/header/navigation',
            payload: {
                type: 'category',
                id: node.id,
            },
        });
    };

    const navigateToGuideDashboard = () => {
        setView('GUIDE_DEFAULT');
        analytics.report({
            type: 'guide/header/navigation',
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
        <BreadcrumbWrapper>
            <PreviousCategoryLink
                onClick={() => {
                    if (grandParentNode) {
                        navigateToCategory(grandParentNode);
                    } else {
                        navigateToGuideDashboard();
                    }
                }}
            >
                {grandParentNode ? (
                    getNodeTitle(grandParentNode, language)
                ) : (
                    <Translation id="TR_GUIDE_DASHBOARD" />
                )}
            </PreviousCategoryLink>
            <BreadcrumbDelimiter>/</BreadcrumbDelimiter>
            <CategoryLink
                onClick={() => {
                    if (grandParentNode) {
                        navigateToCategory(grandParentNode);
                    } else if (parentNode) {
                        navigateToCategory(parentNode);
                    }
                }}
            >
                {parentNode && getNodeTitle(parentNode, language)}
            </CategoryLink>
        </BreadcrumbWrapper>
    );
};

export default HeaderBreadcrumb;
