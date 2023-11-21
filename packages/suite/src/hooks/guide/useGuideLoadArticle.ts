import { useState, useEffect } from 'react';
import type { GuideNode } from '@suite-common/suite-types';
import type { Locale } from 'src/config/suite/languages';

export const loadPageMarkdownFile = async (id: string, language = 'en'): Promise<string> => {
    const file = await import(`@trezor/suite-data/files/guide/${language}${id}`);
    const md = await file.default;
    return md;
};

export const useGuideLoadArticle = (currentNode: GuideNode | null, language: Locale = 'en') => {
    const [markdown, setMarkdown] = useState<string>();
    const [hasError, setHasError] = useState<boolean>(false);

    useEffect(() => {
        if (!currentNode) return;
        loadPageMarkdownFile(currentNode.id, language)
            .catch(() => loadPageMarkdownFile(currentNode.id))
            .then(res => setMarkdown(res))
            .catch(e => {
                console.error(`Loading of ${currentNode.id} article failed: ${e}`);
                setHasError(true);
            });
    }, [currentNode, language]);

    return {
        markdown,
        hasError,
    };
};
