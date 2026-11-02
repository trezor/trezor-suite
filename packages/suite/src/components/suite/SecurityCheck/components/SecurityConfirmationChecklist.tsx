import { Card, Checkbox, Column, IconCircle, Row } from '@trezor/components';

import { type SecurityConfirmationItem } from '../types';

type SecurityConfirmationChecklistProps = {
    items: readonly SecurityConfirmationItem[];
    confirmedItemIds: readonly string[];
    onToggle: (id: string) => void;
};

export const SecurityConfirmationChecklist = ({
    items,
    confirmedItemIds,
    onToggle,
}: SecurityConfirmationChecklistProps) => (
    <Card type="contrast" paddingType="small">
        <Column gap={16}>
            {items.map(item => (
                <Checkbox
                    key={item.id}
                    isChecked={confirmedItemIds.includes(item.id)}
                    onChange={() => onToggle(item.id)}
                    labelAlignment="start"
                    verticalAlignment="center"
                    data-testid={`@onboarding/device-check/checkbox/${item.id}`}
                >
                    <Row gap={12} alignItems="center">
                        <IconCircle icon={item.icon} size={32} intent="neutral" />
                        {item.content}
                    </Row>
                </Checkbox>
            ))}
        </Column>
    </Card>
);
