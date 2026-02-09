import { List, Markdown as MarkdownComponent, Paragraph, Text } from '@trezor/components';

type MarkdownProps = {
    children?: string | null;
};
export const Markdown = ({ children: childrenMarkdown }: MarkdownProps) => (
    <MarkdownComponent
        components={{
            code: ({ children }) => (
                <Text isMonospaced typographyStyle="label" variant="default">
                    {children}
                </Text>
            ),
            p: ({ children }) => (
                <Paragraph typographyStyle="label" variant="default">
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
