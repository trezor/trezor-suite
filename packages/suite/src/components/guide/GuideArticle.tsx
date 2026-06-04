import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import type { GuideCategory } from '@suite-common/suite-types';
import { spacingsPx } from '@trezor/theme';

import { openNode, setView } from 'src/actions/suite/guideActions';
import { GuideContent, GuideHeader, GuideMarkdown, GuideViewWrapper } from 'src/components/guide';
import { useGuideLoadArticle } from 'src/hooks/guide';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { findAncestorNodes, getNodeTitle } from 'src/utils/suite/guide';

const ArticleWrapper = styled.div`
    padding-bottom: ${spacingsPx.xxl};
`;

export const GuideArticle = () => {
    const currentNode = useSelector(state => state.guide.currentNode);
    const indexNode = useSelector(state => state.guide.indexNode);
    const language = useSelector(selectLanguage);
    const dispatch = useDispatch();

    const { markdown, hasError } = useGuideLoadArticle(currentNode, language);

    const parentCategory =
        currentNode && indexNode
            ? (
                  findAncestorNodes(currentNode, indexNode).filter(
                      node => node.type === 'category',
                  ) as GuideCategory[]
              ).pop()
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
