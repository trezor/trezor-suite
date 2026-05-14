import { type ReactNode } from 'react';

import { Badge, CollapsibleBox, Column, Row, Text } from '@trezor/components';

export type EarnInANutshellProcess = {
    heading: ReactNode;
    badge?: ReactNode;
    content: ReactNode;
};

interface EarnInANutshellProcessesProps {
    items: EarnInANutshellProcess[];
}

export const EarnInANutshellProcesses = ({ items }: EarnInANutshellProcessesProps) => (
    <Column gap={20}>
        {items.map(({ heading, badge, content }, index) => (
            <CollapsibleBox
                key={index}
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
            >
                {content}
            </CollapsibleBox>
        ))}
    </Column>
);
