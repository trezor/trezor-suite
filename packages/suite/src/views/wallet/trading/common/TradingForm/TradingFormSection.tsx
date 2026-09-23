import { type ReactNode } from 'react';

import { Badge, Column, Row, Text } from '@trezor/components';

type TradingFormSectionProps = {
    title?: ReactNode;
    errorMessage?: string;
    children: ReactNode;
    'data-testid'?: string;
};

export const TradingFormSection = ({
    title,
    errorMessage,
    children,
    'data-testid': dataTestId,
}: TradingFormSectionProps) => (
    <Column
        gap={4}
        padding={{ horizontal: 20, vertical: 16 }}
        alignItems="stretch"
        data-testid={dataTestId}
    >
        {!!title && (
            <Row gap={8} justifyContent="space-between" alignItems="center">
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    {title}
                </Text>
                {!!errorMessage && (
                    <Badge intent="critical" data-testid={dataTestId && `${dataTestId}/error`}>
                        {errorMessage}
                    </Badge>
                )}
            </Row>
        )}
        <Column gap={8} alignItems="stretch">
            {children}
        </Column>
    </Column>
);
