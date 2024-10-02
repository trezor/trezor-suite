import styled from 'styled-components';

import { useSelector } from 'src/hooks/suite';
import { GuideHeader, GuideContent, GuideViewWrapper, GuideMarkdown } from 'src/components/guide';
import { Translation } from 'src/components/suite';
import { useGuideLoadArticle } from 'src/hooks/guide';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';
import { spacingsPx } from '@trezor/theme';

const ArticleWrapper = styled.div`
    padding-bottom: ${spacingsPx.xxl};
`;

export const GuideArticle = () => {
    const currentNode = useSelector(state => state.guide.currentNode);
    const language = useSelector(selectLanguage);

    const { markdown, hasError } = useGuideLoadArticle(currentNode, language);

    return (
        <GuideViewWrapper>
            <GuideHeader useBreadcrumb />
            <GuideContent>
                <ArticleWrapper>
                    <GuideMarkdown markdown={markdown} />
                </ArticleWrapper>
                {hasError && <Translation id="TR_GENERIC_ERROR_TITLE" />}
            </GuideContent>
        </GuideViewWrapper>
    );
};
