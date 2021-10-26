import React, { useEffect, useState } from 'react';
import { useSelector } from '@suite-hooks';
import { Header, Content, ViewWrapper } from '@guide-components';
import { GuideMarkdown } from '@guide-views';
import { Translation } from '@suite-components';

const loadPageMarkdownFile = async (id: string, language = 'en') => {
    const file = await import(`@trezor/suite-data/files/guide/${language}${id}`);
    const md = await file.default;
    return md;
};

const GuidePage = () => {
    const [markdown, setMarkdown] = useState<string>();
    const [hasError, setHasError] = useState<boolean>(false);

    const { currentNode, language } = useSelector(state => ({
        currentNode: state.guide.currentNode,
        language: state.suite.settings.language,
    }));

    useEffect(() => {
        const loadMarkdown = async () => {
            if (currentNode) {
                let md;
                try {
                    md = await loadPageMarkdownFile(currentNode.id, language);
                } catch (e) {
                    // console.error(
                    //     `Loading of ${currentNode.id} page in ${language} language failed: ${e}`,
                    // );
                    try {
                        md = await loadPageMarkdownFile(currentNode.id);
                    } catch (e) {
                        console.error(`Loading of ${currentNode.id} page in english failed: ${e}`);
                        setHasError(true);
                        return;
                    }
                }
                setMarkdown(md);
            }
        };
        loadMarkdown();
    }, [currentNode, language]);

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

export default GuidePage;
