import { List, Markdown as MarkdownComponent, Paragraph, Text } from '@trezor/components';

type MarkdownProps = {
    children?: string | null;
};
export const Markdown = ({ children: childrenMarkdown }: MarkdownProps) => (
    <MarkdownComponent
        components={{
            code: ({ children }) => (
                <Text isMonospaced typographyStyle="inherit" intent="neutral">
                    {children}
                </Text>
            ),
            p: ({ children }) => (
                <Paragraph typographyStyle="inherit" intent="neutral">
                    {children}
                </Paragraph>
            ),
            ul: ({ children }) => <List>{children}</List>,
            li: ({ children }) => <List.Item>{children}</List.Item>,
        }}
    >
        {childrenMarkdown}
    </MarkdownComponent>
);
