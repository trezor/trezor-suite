import { useSelector } from 'src/hooks/suite';
import { Header, Content, ViewWrapper, GuideMarkdown } from 'src/components/guide';
import { Translation } from 'src/components/suite';
import { useGuideLoadPage } from 'src/hooks/guide';

export const GuidePage = () => {
    const currentNode = useSelector(state => state.guide.currentNode);
    const language = useSelector(state => state.suite.settings.language);

    const { markdown, hasError } = useGuideLoadPage(currentNode, language);

    return (
        <ViewWrapper>
            <Header useBreadcrumb />
            <Content>
                <GuideMarkdown markdown={markdown} />
                {hasError && <Translation id="TR_GENERIC_ERROR_TITLE" />}
            </Content>
        </ViewWrapper>
    );
};
