import styled from 'styled-components';

import {
    Icon,
    Link,
    List,
    Markdown as MarkdownComponent,
    Paragraph,
    Text,
} from '@trezor/components';
import { borders } from '@trezor/theme';

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
        border-radius: ${borders.radii.xxs};
    }
`;

type MarkdownProps = {
    children?: string | null;
};
export const Markdown = ({ children: childrenMarkdown }: MarkdownProps) => (
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
                        {children}
                    </Text>
                </Code>
            ),
            strong: ({ children }) => <Text typographyStyle="body-sm-strong">{children}</Text>,
            a: ({ children, ...rest }) => <Link {...rest}>{children}</Link>,
            p: ({ children }) => (
                <Paragraph typographyStyle="inherit" intent="neutral" margin={{ bottom: 8 }}>
                    {children}
                </Paragraph>
            ),
            ul: ({ children }) => (
                <List gap={0} bulletComponent={<Icon name="circleFilled" size={8} />}>
                    {children}
                </List>
            ),
            li: ({ children }) => <List.Item>{children}</List.Item>,
        }}
    >
        {childrenMarkdown}
    </MarkdownComponent>
);
