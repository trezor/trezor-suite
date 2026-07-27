import { type ReactNode } from 'react';

import { type YieldFlowType } from '@suite-common/wallet-core';
import { Badge, CollapsibleBox, Column, Row, Text } from '@trezor/components';

export type EarnInANutshellProcess = {
    processType?: YieldFlowType;
    'data-testid'?: string;
    heading: ReactNode;
    badge?: ReactNode;
    content: ReactNode;
};

interface EarnInANutshellProcessesProps {
    items: EarnInANutshellProcess[];
    onItemToggle?: (processType: YieldFlowType, isOpen: boolean) => void;
}

export const EarnInANutshellProcesses = ({
    items,
    onItemToggle,
}: EarnInANutshellProcessesProps) => (
    <Column gap={20}>
        {items.map(({ processType, 'data-testid': dataTestId, heading, badge, content }, index) => (
            <CollapsibleBox
                key={index}
                data-testid={dataTestId}
                heading={
                    <Row gap={8}>
                        <Text intent="neutral" priority="secondary">
                            {heading}
                        </Text>
                        {badge && <Badge size="small">{badge}</Badge>}
                    </Row>
                }
                fillType="none"
                paddingType="none"
                hasDivider={false}
                onAnimationComplete={
                    processType && onItemToggle
                        ? isOpen => onItemToggle(processType, isOpen)
                        : undefined
                }
            >
                {content}
            </CollapsibleBox>
        ))}
    </Column>
);
