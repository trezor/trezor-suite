import { type ReactNode } from 'react';

import { Column, H3, Paragraph } from '@trezor/components';

type TradingDetailTerminalStateProps = {
    artwork?: ReactNode;
    title: ReactNode;
    description: ReactNode;
    action?: ReactNode;
    children?: ReactNode;
};

export const TradingDetailTerminalState = ({
    artwork,
    title,
    description,
    action,
    children,
}: TradingDetailTerminalStateProps) => (
    <Column>
        <Column gap={20} padding={20}>
            {artwork}
            <Column>
                <H3 data-testid="@trading/transaction/detail/status">{title}</H3>
                <Paragraph
                    typographyStyle="body-sm"
                    intent="neutral"
                    priority="secondary"
                    textWrap="pretty"
                >
                    {description}
                </Paragraph>
            </Column>
            {action}
        </Column>
        {children}
    </Column>
);
