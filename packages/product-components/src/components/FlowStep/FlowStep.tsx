import { type ReactNode } from 'react';

import { Card, Column, Icon, Row, Text } from '@trezor/components';
import { CheckCircleFilledIcon } from '@trezor/icons';

export type FlowStepState = 'active' | 'done' | 'upcoming';

export type FlowStepProps = {
    label: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    state: FlowStepState;
    addon?: ReactNode;
    children?: ReactNode;
    'data-testid'?: string;
};

export const FlowStep = ({
    label,
    title,
    description,
    state,
    addon,
    children,
    'data-testid': dataTest,
}: FlowStepProps) => {
    if (state === 'done') {
        return (
            <Card type="flat" paddingType="small" data-testid={dataTest} data-state={state}>
                <Row gap={8}>
                    <Icon as={CheckCircleFilledIcon} intent="brand" size={20} />
                    <Text typographyStyle="body-md-strong" intent="brand">
                        {title}
                    </Text>
                </Row>
            </Card>
        );
    }

    if (state === 'upcoming') {
        return (
            <Card type="flat" paddingType="small" data-testid={dataTest} data-state={state}>
                <Row justifyContent="space-between" alignItems="center" gap={12}>
                    <Column gap={4}>
                        <Text
                            typographyStyle="body-sm-strong"
                            isAllCaps
                            intent="neutral"
                            priority="secondary"
                        >
                            {label}
                        </Text>
                        <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                            {title}
                        </Text>
                    </Column>
                    {addon}
                </Row>
            </Card>
        );
    }

    return (
        <Card type="raised" data-testid={dataTest} data-state={state}>
            <Column gap={16}>
                <Column gap={4}>
                    <Text typographyStyle="body-sm-strong" isAllCaps intent="brand">
                        {label}
                    </Text>
                    <Text typographyStyle="headline-sm">{title}</Text>
                    {description && (
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            {description}
                        </Text>
                    )}
                </Column>
                {children}
            </Column>
        </Card>
    );
};
