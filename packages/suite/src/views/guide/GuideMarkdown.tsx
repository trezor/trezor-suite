import React, { useEffect } from 'react';
import { variables } from '@trezor/components';
import { TrezorLink } from '@suite-components';
import ReactMarkdown from 'react-markdown';
import styled, { keyframes } from 'styled-components';
import { useGuideOpenNode } from '@guide-hooks';

const DISPLAY_SLOWLY = keyframes`
    from { opacity: 0.0; }
    to { opacity: 1.0; }
`;

const StyledMarkdown = styled.div`
    animation: ${DISPLAY_SLOWLY} 0.5s ease;
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
`;

const StyledInnerLink = styled.a``;

interface Props {
    markdown: any;
}

const GuideMarkdown = ({ markdown }: Props) => {
    const { openNodeById } = useGuideOpenNode();
    const ref = React.createRef<HTMLDivElement>();
    useEffect(() => {
        if (ref.current) {
            ref.current.parentElement?.parentElement?.scrollTo(0, 0); // scroll wrapper to top on new content
        }
    }, [markdown, ref]);

    return (
        <StyledMarkdown ref={ref}>
            <ReactMarkdown
                renderers={{
                    link: ({ children, href }) =>
                        href.startsWith('http') ? (
                            <TrezorLink variant="default" href={href}>
                                {children}
                            </TrezorLink>
                        ) : (
                            <StyledInnerLink role="link" onClick={() => openNodeById(href)}>
                                {children}
                            </StyledInnerLink>
                        ),
                }}
            >
                {markdown}
            </ReactMarkdown>
        </StyledMarkdown>
    );
};
export default GuideMarkdown;
