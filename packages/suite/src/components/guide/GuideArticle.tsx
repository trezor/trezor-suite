import { useSelector } from 'src/hooks/suite';
import { GuideHeader, GuideContent, GuideViewWrapper, GuideMarkdown } from 'src/components/guide';
import { Translation } from 'src/components/suite';
import { useGuideLoadArticle } from 'src/hooks/guide';

export const GuideArticle = () => {
    const currentNode = useSelector(state => state.guide.currentNode);
    const language = useSelector(state => state.suite.settings.language);

    const { markdown, hasError } = useGuideLoadArticle(currentNode, language);

    return (
        <GuideViewWrapper>
            <GuideHeader useBreadcrumb />
            <GuideContent>
                <GuideMarkdown markdown={markdown} />
                {hasError && <Translation id="TR_GENERIC_ERROR_TITLE" />}
            </GuideContent>
        </GuideViewWrapper>
    );
};
