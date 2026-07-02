import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Card, Column, Row, Text, TextButton } from '@trezor/components';
import { HELP_CENTER_CANCEL_TRANSACTION } from '@trezor/urls';

type CancelTransactionCardProps = {
    children: ReactNode;
};

export const CancelTransactionCard = ({ children }: CancelTransactionCardProps) => (
    <Card
        type="contrast"
        paddingType="small"
        header={
            <Row justifyContent="space-between">
                <Text typographyStyle="body-md-strong">
                    <Translation id="TR_CANCEL_TX_HEADER" />
                </Text>
                <TextButton href={HELP_CENTER_CANCEL_TRANSACTION} isUnderlined size="small">
                    <Translation id="TR_LEARN_MORE" />
                </TextButton>
            </Row>
        }
    >
        <Column gap={16}>{children}</Column>
    </Card>
);
