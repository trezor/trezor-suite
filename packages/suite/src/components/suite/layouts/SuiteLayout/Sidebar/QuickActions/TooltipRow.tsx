import { type ReactNode } from 'react';

import { Column, Icon, type IconName, Row, Text, type UIIntent } from '@trezor/components';

type UpdateRowProps = {
    children: ReactNode;
    leftItem: ReactNode;
    header: ReactNode;
    intent: UIIntent;
    iconName: IconName;
    onClick?: () => void;
};

export const TooltipRow = ({
    leftItem,
    children,
    header,
    intent,
    iconName,
    onClick,
}: UpdateRowProps) => (
    <Row gap={12} onClick={onClick} cursor={onClick ? 'pointer' : undefined}>
        {leftItem}
        <Column alignItems="start">
            <Text>{header}</Text>
            <Row gap={4}>
                <Icon name={iconName} intent={intent} size={12} priority="secondary" />
                <Text intent={intent} priority="secondary">
                    {children}
                </Text>
            </Row>
        </Column>
    </Row>
);
