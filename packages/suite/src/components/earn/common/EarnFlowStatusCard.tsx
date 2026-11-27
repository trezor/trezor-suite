import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Card, Column, Divider, Icon, Row, Text } from '@trezor/components';
import { CheckCircleFilledIcon } from '@trezor/icons';

type EarnFlowStatusCardProps = {
    statusTestId?: string;
    children: ReactNode;
};

export const EarnFlowStatusCard = ({ statusTestId, children }: EarnFlowStatusCardProps) => (
    <Card type="contrast" paddingType="none">
        <Column gap={0}>
            <Row
                justifyContent="space-between"
                alignItems="center"
                padding={{ vertical: 16, horizontal: 20 }}
            >
                <Text typographyStyle="body-md">
                    <Translation id="TR_EARN_YIELD_STATUS" />
                </Text>
                <Row alignItems="center" gap={8}>
                    <Icon as={CheckCircleFilledIcon} intent="brand" />
                    <Text data-testid={statusTestId} typographyStyle="body-md" intent="brand">
                        <Translation id="TR_EARN_YIELD_COMPLETED" />
                    </Text>
                </Row>
            </Row>
            <Divider color="borderNeutral" margin={0} />
            {children}
        </Column>
    </Card>
);
