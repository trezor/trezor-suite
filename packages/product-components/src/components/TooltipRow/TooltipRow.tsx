import type { ReactNode } from 'react';

import { Column, Icon, type IconComponent, Row, Text, type UIIntent } from '@trezor/components';

type TooltipRowProps = {
    children: ReactNode;
    leftItem: ReactNode;
    header: ReactNode;
    intent: UIIntent;
    icon: IconComponent;
    onClick?: () => unknown;
};

export const TooltipRow = ({
    leftItem,
    children,
    header,
    intent,
    icon,
    onClick,
}: TooltipRowProps) => (
    <Row gap={12} onClick={onClick} cursor={onClick ? 'pointer' : undefined}>
        {leftItem}
        <Column alignItems="start">
            <Text>{header}</Text>
            <Row gap={4}>
                <Icon as={icon} intent={intent} size={12} priority="secondary" />
                <Text intent={intent} priority="secondary">
                    {children}
                </Text>
            </Row>
        </Column>
    </Row>
);
