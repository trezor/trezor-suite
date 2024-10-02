import { useEffect, useRef } from 'react';
import { Markdown } from '@trezor/components';
import { useGuideOpenNode } from 'src/hooks/guide';
import { GuideHint } from './GuideHint';
import { TrezorLink } from '../suite';
import { spacings } from '@trezor/theme';

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
        <div ref={ref}>
            {markdown && (
                <Markdown
                    margin={{
                        top: spacings.md,
                        right: spacings.lg,
                        bottom: spacings.xxl,
                        left: spacings.lg,
                    }}
                    components={{
                        a: ({ children, href }) => {
                            if (!href) {
                                console.error('Missing href in Suite Guide link!');

                                return null;
                            }

                            return href.startsWith('http') ? (
                                <TrezorLink variant="default" href={href}>
                                    {children}
                                </TrezorLink>
                            ) : (
                                <TrezorLink variant="default" onClick={() => openNodeById(href)}>
                                    {children}
                                </TrezorLink>
                            );
                        },
                        blockquote: props => <GuideHint {...props} />,
                    }}
                >
                    {markdown}
                </Markdown>
            )}
        </div>
    );
};
