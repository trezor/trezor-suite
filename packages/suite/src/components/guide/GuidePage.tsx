import React from 'react';
import { useSelector } from '@suite-hooks';
import { Header, Content, ViewWrapper, GuideMarkdown } from '@guide-components';
import { Translation } from '@suite-components';
import { useGuideLoadPage } from '@guide-hooks';

export const GuidePage = () => {
    const { currentNode, language } = useSelector(state => ({
        currentNode: state.guide.currentNode,
        language: state.suite.settings.language,
    }));

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
