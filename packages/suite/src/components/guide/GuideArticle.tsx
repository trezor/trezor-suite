import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { GuideContent } from './GuideContent';
import { GuideHeader } from './GuideHeader';
import { GuideMarkdown } from './GuideMarkdown';
import { GuideViewWrapper } from './GuideViewWrapper';
import { openNode, setView } from '../../actions/suite/guideActions';
import { useGuideLoadArticle } from '../../hooks/guide';
import { useSelector } from '../../hooks/suite';
import { selectGuideCurrentNode, selectGuideIndexNode } from '../../selectors/suite/guideSelectors';
import { findAncestorNodes, getNodeTitle } from '../../utils/suite/guide';

const ArticleWrapper = styled.div`
    padding-bottom: 32px;
`;

export const GuideArticle = () => {
    const currentNode = useSelector(selectGuideCurrentNode);
    const indexNode = useSelector(selectGuideIndexNode);
    const language = useSelector(selectLanguage);
    const { dispatch } = useServices(injectDispatch);

    const { markdown, hasError } = useGuideLoadArticle(currentNode, language);

    // Level 2 categories don't have their own view — they render inside the level 1 view.
    // Always go back to the level 1 ancestor so the user lands on the same screen they came from.
    const parentCategory =
        currentNode && indexNode
            ? findAncestorNodes(currentNode, indexNode).filter(node => node.type === 'category')[0]
            : undefined;

    const goBack = () => {
        if (parentCategory) {
            dispatch(openNode(parentCategory));
        } else {
            dispatch(setView('GUIDE_DEFAULT'));
        }
    };

    const title = currentNode ? getNodeTitle(currentNode, language) : undefined;

    // Title is rendered in the header, so strip the leading `# Title` from the markdown.
    const articleBody = markdown?.replace(/^\s*#\s.*\r?\n+/, '');

    return (
        <GuideViewWrapper>
            <GuideHeader back={goBack} label={title} />
            <GuideContent>
                <ArticleWrapper>
                    <GuideMarkdown markdown={articleBody} />
                </ArticleWrapper>
                {hasError && <Translation id="TR_GENERIC_ERROR_TITLE" />}
            </GuideContent>
        </GuideViewWrapper>
    );
};
