import { useEffect, useState } from 'react';
import Markdown from 'markdown-it';
import MarkdownReplaceLink from 'markdown-it-replace-link';
import MarkdownReplaceLinkAttrs from 'markdown-it-link-attributes';

const GITHUB = `https://github.com/trezor/trezor-suite/blob/${process.env.COMMIT_HASH}/docs/packages/connect`;
const CDN = `https://raw.githubusercontent.com/trezor/trezor-suite/${process.env.COMMIT_HASH}/docs/packages/connect/`;

export const useDocs = (url: string) => {
    const [docs, setDocs] = useState<string>();

    useEffect(() => {
        fetch(url, { credentials: 'same-origin' })
            .then(response => {
                if (response.ok) {
                    return response.text();
                }
                throw new Error('Network response was not ok.');
            })
            .then(content => {
                // @ts-expect-error
                const markdown = new Markdown({
                    replaceLink: (link: string, _env: any) => {
                        let baseUrl = GITHUB;

                        // .png ...
                        if (!link.endsWith('.md')) {
                            baseUrl = CDN;
                        }
                        if (link.startsWith('http')) {
                            return link;
                        }

                        if (link.startsWith('./')) {
                            return `${baseUrl}/${link}`.replace('./', '');
                        }
                        return `${baseUrl}/${link}`;
                    },
                });
                markdown.use(MarkdownReplaceLink);
                markdown.use(MarkdownReplaceLinkAttrs, {
                    attrs: {
                        target: '_blank',
                        rel: 'noopener',
                    },
                });
                const html = markdown.render(content);
                setDocs(html);
            })
            .catch(_error => {
                setDocs('failed to load');
            });
    }, [url]);

    return docs;
};
