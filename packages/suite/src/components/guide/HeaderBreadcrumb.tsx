import styled from 'styled-components';
import { darken } from 'polished';
import { analytics, EventType } from '@trezor/suite-analytics';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { openNode, setView } from 'src/actions/suite/guideActions';
import { variables } from '@trezor/components';
import { Translation } from 'src/components/suite';
// importing directly, otherwise unit tests fail, seems to be a styled-components issue
import { TrezorLink } from 'src/components/suite/TrezorLink';
import { findAncestorNodes, getNodeTitle } from 'src/utils/suite/guide';

import type { GuideCategory } from '@suite-common/suite-types';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';

const BreadcrumbWrapper = styled.span`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    white-space: normal;
`;

const PreviousCategoryLink = styled(TrezorLink)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    transition: ${({ theme }) =>
        `background ${theme.HOVER_TRANSITION_TIME} ${theme.HOVER_TRANSITION_EFFECT}`};

    :hover {
        color: ${({ theme }) => darken(theme.HOVER_DARKEN_FILTER, theme.TYPE_LIGHT_GREY)};
    }
`;

const BreadcrumbDelimiter = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    margin: 0 5px;
`;

const CategoryLink = styled(TrezorLink)`
    color: ${({ theme }) => theme.TYPE_GREEN};
    transition: ${({ theme }) =>
        `background ${theme.HOVER_TRANSITION_TIME} ${theme.HOVER_TRANSITION_EFFECT}`};

    :hover {
        color: ${({ theme }) => darken(theme.HOVER_DARKEN_FILTER, theme.TYPE_GREEN)};
    }
`;

export const HeaderBreadcrumb = () => {
    const language = useSelector(selectLanguage);
    const indexNode = useSelector(state => state.guide.indexNode);
    const currentNode = useSelector(state => state.guide.currentNode);
    const dispatch = useDispatch();

    const goToDashboard = () => dispatch(setView('GUIDE_DEFAULT'));

    // if no parent available, offer navigation to guide dashboard
    const FallbackBreadcrumb = (
        <BreadcrumbWrapper>
            <CategoryLink onClick={goToDashboard}>
                <Translation id="TR_GUIDE_DASHBOARD" />
            </CategoryLink>
        </BreadcrumbWrapper>
    );

    if (!currentNode || !indexNode) return FallbackBreadcrumb;

    const parentNodes = findAncestorNodes(currentNode, indexNode).filter(
        node => node.type === 'category',
    ) as GuideCategory[];

    if (!parentNodes.length) return FallbackBreadcrumb;

    const navigateToCategory = (node: GuideCategory) => {
        dispatch(openNode(node));
        analytics.report({
            type: EventType.GuideHeaderNavigation,
            payload: {
                type: 'category',
                id: node.id,
            },
        });
    };

    const navigateToGuideDashboard = () => {
        dispatch(setView('GUIDE_DEFAULT'));
        analytics.report({
            type: EventType.GuideHeaderNavigation,
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
                data-test="@guide/header-breadcrumb/previous-category-link"
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
                data-test="@guide/header-breadcrumb/category-link"
            >
                {parentNode && getNodeTitle(parentNode, language)}
            </CategoryLink>
        </BreadcrumbWrapper>
    );
};
