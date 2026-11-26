import { type ReactNode } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { Card, Column, Divider, Icon, Row, Text } from '@trezor/components';
import { CheckCircleFilledIcon } from '@trezor/icons';

type EarnFlowStatusCardProps = {
    statusLabelId?: TranslationKey;
    statusTestId?: string;
    children?: ReactNode;
};

export const EarnFlowStatusCard = ({
    statusLabelId = 'TR_EARN_YIELD_COMPLETED',
    statusTestId,
    children,
}: EarnFlowStatusCardProps) => (
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
                        <Translation id={statusLabelId} />
                    </Text>
                </Row>
            </Row>

            {children != null && <Divider color="borderNeutral" margin={0} />}
            {children}
        </Column>
    </Card>
);
