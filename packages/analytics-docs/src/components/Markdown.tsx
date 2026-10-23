import styled from 'styled-components';

import {
    Icon,
    Link,
    List,
    Markdown as MarkdownComponent,
    Paragraph,
    Text,
} from '@trezor/components';
import { CircleFilledIcon } from '@trezor/icons';

import { HighlightedContent } from './HighlightedContent';

const Code = styled.span`
    margin: 2px;
    position: relative;
    display: inline-block;

    &::before {
        content: '';
        position: absolute;
        inset: -2px;
        border: solid 1px ${({ theme }) => theme.borderNeutral};
        background: ${({ theme }) => theme.surfaceFillRaised};
        border-radius: 4px;
    }
`;

type MarkdownProps = {
    children?: string | null;
    query?: string;
};
export const Markdown = ({ children: childrenMarkdown, query = '' }: MarkdownProps) => (
    <MarkdownComponent
        components={{
            code: ({ children }) => (
                <Code>
                    <Text
                        isMonospaced
                        typographyStyle="inherit"
                        intent="neutral"
                        position={{ type: 'relative' }}
                    >
                        <HighlightedContent query={query}>{children}</HighlightedContent>
                    </Text>
                </Code>
            ),
            strong: ({ children }) => (
                <Text typographyStyle="body-sm-strong">
                    <HighlightedContent query={query}>{children}</HighlightedContent>
                </Text>
            ),
            a: ({ children, ...rest }) => (
                <Link {...rest}>
                    <HighlightedContent query={query}>{children}</HighlightedContent>
                </Link>
            ),
            p: ({ children }) => (
                <Paragraph typographyStyle="inherit" intent="neutral" margin={{ bottom: 8 }}>
                    <HighlightedContent query={query}>{children}</HighlightedContent>
                </Paragraph>
            ),
            ul: ({ children }) => (
                <List gap={0} bulletComponent={<Icon as={CircleFilledIcon} size={8} />}>
                    {children}
                </List>
            ),
            li: ({ children }) => (
                <List.Item>
                    <HighlightedContent query={query}>{children}</HighlightedContent>
                </List.Item>
            ),
        }}
    >
        {childrenMarkdown}
    </MarkdownComponent>
);
