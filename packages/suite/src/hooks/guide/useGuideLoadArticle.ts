import { useEffect, useState } from 'react';

import type { GuideNode, Locale } from '@suite-common/suite-types';

export const loadPageMarkdownFile = async (id: string, language = 'en-US'): Promise<string> => {
    const cleanId = id.startsWith('/') ? id : `/${id}`;
    const url = `/guide/${language.toLowerCase()}${cleanId}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to load markdown: ${response.statusText}`);
    }

    const markdown = await response.text();

    return markdown;
};

export const useGuideLoadArticle = (currentNode: GuideNode | null, language: Locale = 'en-US') => {
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
