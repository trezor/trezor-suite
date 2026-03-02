import { useEffect, useRef } from 'react';

import type { Highlighter } from 'shiki';

import { useMDXComponents } from '@trezor/connect-explorer-theme';

type HighlightedCodeProps = {
    code: string;
    language?: string;
};

let cachedHighlighter: Highlighter | null = null;

const highlighterPromise = import('shiki').then(
    ({ createHighlighter, createCssVariablesTheme }) => {
        const theme = createCssVariablesTheme({
            name: 'css-variables',
            variablePrefix: '--shiki-',
            variableDefaults: {},
            fontStyle: true,
        });

        return createHighlighter({
            themes: [theme],
            langs: ['javascript', 'typescript', 'json'],
        });
    },
);

highlighterPromise.then(h => {
    cachedHighlighter = h;
});

export const HighlightedCode = ({ code, language = 'javascript' }: HighlightedCodeProps) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const components = useMDXComponents() as any;
    const Pre = components.pre ?? 'pre';
    const Code = components.code ?? 'code';

    useEffect(() => {
        const applyHighlighting = () => {
            if (!cachedHighlighter || !wrapperRef.current) return;

            const html = cachedHighlighter.codeToHtml(code, {
                lang: language,
                theme: 'css-variables',
            });
            const match = html.match(/<code[^>]*>([\s\S]*)<\/code>/);
            const codeEl = wrapperRef.current.querySelector('code');
            if (match?.[1] && codeEl) {
                codeEl.innerHTML = match[1];
            }
        };

        if (cachedHighlighter) {
            applyHighlighting();
        } else {
            highlighterPromise.then(applyHighlighting);
        }
    }, [code, language]);

    return (
        <div ref={wrapperRef}>
            <Pre>
                <Code data-language={language}>{code}</Code>
            </Pre>
        </div>
    );
};
