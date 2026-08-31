import { useDispatch } from 'react-redux';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { useSelector } from '@suite-common/redux-utils';

import { openNode, setView } from 'src/actions/suite/guideActions';
import { GuideContent, GuideHeader, GuideMarkdown, GuideViewWrapper } from 'src/components/guide';
import { useGuideLoadArticle } from 'src/hooks/guide';
import { findAncestorNodes, getNodeTitle } from 'src/utils/suite/guide';

const ArticleWrapper = styled.div`
    padding-bottom: 32px;
`;

export const GuideArticle = () => {
    const currentNode = useSelector(state => state.guide.currentNode);
    const indexNode = useSelector(state => state.guide.indexNode);
    const language = useSelector(selectLanguage);
    const dispatch = useDispatch();

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
