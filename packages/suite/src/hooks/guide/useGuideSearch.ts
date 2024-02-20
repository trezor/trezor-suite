import { useState, useEffect, useMemo } from 'react';
import { GuideCategory, GuideArticle } from '@suite-common/suite-types';
import { loadPageMarkdownFile } from 'src/hooks/guide/useGuideLoadArticle';

const SEARCH_DELAY = 300;
const MIN_QUERY_LENGTH = 3;
const MAX_RESULTS = 5;

type PageMap = {
    [url: string]: GuideArticle;
};

export type SearchResult = {
    page: GuideArticle;
    score: number;
    preview?: {
        content: string;
        from: number;
        length: number;
    };
};

const getPreview = (markdown: string, query: string, index: number) => {
    const previewStart = markdown.substring(0, Math.max(index - 10, 0)).lastIndexOf(' ') + 1;
    const previewEnd = markdown.indexOf(' ', index + query.length + 20);

    return {
        content: markdown.slice(previewStart, previewEnd),
        from: index - previewStart,
        length: query.length,
    };
};

const removeAccents = (str: string) =>
    str
        .normalize('NFD') // decouple accents from ascii characters
        .replace(/[\u0300-\u036f]/g, ''); // remove accent characters

const searchInFile = (url: string, query: string, markdown: string) => {
    const sanitized = removeAccents(markdown)
        .replace(/[\\#*]/g, '') // remove some markdown syntax
        .replace(/\[([^[\]]*)\]\([^()]*\)/g, '$1') // remove markdown links
        .trim();
    const regex = new RegExp(`\\b${query}`, 'ig'); // find query prepended with non-word char = word start
    const count = sanitized.match(regex)?.length || 0;

    return {
        url,
        score: count,
        preview: count ? getPreview(sanitized, query, sanitized.search(regex)) : undefined,
    };
};

const search = async (query: string, pageMap: PageMap): Promise<SearchResult[]> => {
    const querySanitized = removeAccents(query)
        .replace(/\W+/g, ' ') // replace every non-word char sequence with a single space
        .trim();
    const results =
        querySanitized.length < MIN_QUERY_LENGTH
            ? []
            : await Promise.all(
                  Object.keys(pageMap).map(url =>
                      loadPageMarkdownFile(url)
                          .catch(() => '')
                          .then(md => searchInFile(url, querySanitized, md)),
                  ),
              );

    return results
        .filter(res => res.score)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_RESULTS)
        .map(({ preview, score, url }) => ({ page: pageMap[url], score, preview }));
};

export const useGuideSearch = (query: string, pageRoot: GuideCategory | null) => {
    const pageMap = useMemo(() => {
        const reduceNode = (node: GuideCategory | GuideArticle): PageMap =>
            node.type === 'page'
                ? { [node.id]: node }
                : node.children.reduce(
                      (map, child) => ({
                          ...map,
                          ...reduceNode(child),
                      }),
                      {},
                  );

        return pageRoot ? reduceNode(pageRoot) : {};
    }, [pageRoot]);

    const [searchResult, setSearchResult] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let active = true;
        setLoading(!!query);
        const timeout = setTimeout(() => {
            search(query, pageMap)
                .then(res => {
                    if (!active) return;
                    setSearchResult(res);
                })
                .finally(() => setLoading(false));
        }, SEARCH_DELAY);

        return () => {
            clearTimeout(timeout);
            active = false;
        };
    }, [query, pageMap]);

    return {
        searchResult,
        loading,
    };
};
