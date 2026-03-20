import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { spacingsPx } from '@trezor/theme';

import { GuideContent, GuideHeader, GuideMarkdown, GuideViewWrapper } from 'src/components/guide';
import { useGuideLoadArticle } from 'src/hooks/guide';
import { useSelector } from 'src/hooks/suite';

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
