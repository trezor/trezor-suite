import { useEffect, useRef } from 'react';

import { TrezorLink } from '@suite/external-links';
import { Markdown } from '@trezor/components';

import { useGuideOpenNode } from 'src/hooks/guide';

import { GuideHint } from './GuideHint';
import { GuideImage } from './GuideImage';

interface GuideMarkdownProps {
    markdown: string | undefined;
}

export const GuideMarkdown = ({ markdown }: GuideMarkdownProps) => {
    const { openNodeById } = useGuideOpenNode();
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (ref.current) {
            // scroll to top of article, applies when navigating from article directly to next article
            ref.current.parentElement?.parentElement?.scrollTo(0, 0);
        }
    }, [markdown, ref]);

    return (
        <div ref={ref} data-testid="@guide/article">
            {markdown && (
                <Markdown
                    components={{
                        a: ({ children, href }) => {
                            if (!href) {
                                console.error('Missing href in Suite Guide link!');

                                return null;
                            }

                            return href.startsWith('http') ? (
                                <TrezorLink href={href}>{children}</TrezorLink>
                            ) : (
                                <TrezorLink onClick={() => openNodeById(href)}>
                                    {children}
                                </TrezorLink>
                            );
                        },
                        blockquote: props => <GuideHint {...props} />,
                        img: ({ src, alt }) => <GuideImage src={src} alt={alt} />,
                    }}
                >
                    {markdown}
                </Markdown>
            )}
        </div>
    );
};
