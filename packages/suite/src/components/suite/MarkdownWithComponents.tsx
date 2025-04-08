import { Markdown } from '@trezor/components';

import { TrezorLink } from './TrezorLink';

type MarkdownWithComponentsProps = {
    children: string;
};

export const MarkdownWithComponents = ({ children }: MarkdownWithComponentsProps) => (
    <Markdown
        components={{
            a: ({ children, href }) => {
                if (!href) {
                    return null;
                }

                // Support for both http(s) links and Tor (.onion) addresses
                // All links in release notes are external, so we use TrezorLink
                // which handles opening links in external browser
                return (
                    <TrezorLink variant="underline" href={href} target="_blank">
                        {children}
                    </TrezorLink>
                );
            },
        }}
    >
        {children}
    </Markdown>
);
