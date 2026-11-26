import { type ReactNode } from 'react';

import { Column, Row, Text } from '@trezor/components';

type FormSectionProps = {
    title: ReactNode;
    titleAction?: ReactNode;
    children: ReactNode;
    'data-testid'?: string;
};

export const FormSection = ({
    title,
    titleAction,
    children,
    'data-testid': dataTestId,
}: FormSectionProps) => (
    <Column
        gap={8}
        padding={{ horizontal: 20, vertical: 16 }}
        alignItems="stretch"
        data-testid={dataTestId}
    >
        <Row gap={8} justifyContent="space-between" alignItems="center">
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                {title}
            </Text>
            {titleAction}
        </Row>
        <Column gap={4} alignItems="stretch">
            {children}
        </Column>
    </Column>
);
