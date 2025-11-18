import { ReactNode } from 'react';

import {
    Column,
    IconCircle,
    IconCircleVariant,
    IconName,
    IconVariant,
    Row,
    Text,
} from '@trezor/components';

type UpdateRowProps = {
    children: ReactNode;
    leftItem: ReactNode;
    header: ReactNode;
    variant: IconVariant;
    circleIconName: IconName;
    onClick?: () => void;
};

export const TooltipRow = ({
    leftItem,
    children,
    header,
    variant,
    circleIconName,
    onClick,
}: UpdateRowProps) => (
    <Row gap={12} onClick={onClick}>
        {leftItem}
        <Column alignItems="start">
            <Text>{header}</Text>
            <Row gap={4}>
                <IconCircle
                    size={14}
                    hasBorder={false}
                    paddingType="small"
                    variant={variant as IconCircleVariant}
                    name={circleIconName}
                />
                <Text variant={variant}>{children}</Text>
            </Row>
        </Column>
    </Row>
);
