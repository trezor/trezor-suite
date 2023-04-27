import React, { useEffect, useRef } from 'react';
import { variables } from '@trezor/components';
import { TrezorLink } from '@suite-components';
import ReactMarkdown from 'react-markdown';
import styled from 'styled-components';
import { useGuideOpenNode } from '@guide-hooks';

const StyledMarkdown = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    line-height: 1.5;
    padding: 0 0 32px 0;
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
        color: ${props => props.theme.TYPE_DARK_GREY};
        font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    }
    h1 {
        margin: 8px 0 16px;
        font-size: ${variables.FONT_SIZE.BIG};
    }
    h2 {
        margin-bottom: 8px 0 12px;
        font-size: ${variables.FONT_SIZE.NORMAL};
    }
    h3,
    h4,
    h5,
    h6 {
        margin: 4px 0 12px;
        font-size: ${variables.FONT_SIZE.SMALL};
    }
    p,
    ul,
    ol {
        margin: 4px 0 12px;
    }
    ul,
    ol {
        padding: 0 0 0 16px;
    }
    li {
        margin: 0 0 8px;
    }
    a {
        color: ${props => props.theme.TYPE_GREEN};
        &:hover {
            text-decoration: underline;
        }
    }
    img {
        max-width: 100%;
    }
`;

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
        <StyledMarkdown ref={ref}>
            {markdown && (
                <ReactMarkdown
                    components={{
                        a: ({ children, href }) => {
                            if (!href) {
                                console.error(`Missing href in Suite Guide link!`);
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
                    }}
                >
                    {markdown}
                </ReactMarkdown>
            )}
        </StyledMarkdown>
    );
};
