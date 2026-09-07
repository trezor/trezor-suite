import { type ReactNode } from 'react';

import { Column, H3, IconCircle, type IconCircleProps, Paragraph } from '@trezor/components';

type TradingDetailTerminalStateProps = {
    icon: IconCircleProps['icon'];
    intent?: IconCircleProps['intent'];
    title: ReactNode;
    description: ReactNode;
    action?: ReactNode;
    children?: ReactNode;
};

export const TradingDetailTerminalState = ({
    icon,
    intent,
    title,
    description,
    action,
    children,
}: TradingDetailTerminalStateProps) => (
    <Column gap={24} padding={{ top: 12, bottom: 4 }}>
        <IconCircle icon={icon} intent={intent} size={96} />
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
        {children}
    </Column>
);
