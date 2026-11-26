import { Translation } from '@suite/intl';
import { Card, Column, Text } from '@trezor/components';

type EmptyListMessageProps = {
    id: 'TR_NO_TRANSACTIONS_YET' | 'TR_NO_VISIBLE_TRANSACTIONS' | 'TR_NO_RECENT_TRANSACTIONS';
};

export const EmptyListMessage = ({ id }: EmptyListMessageProps) => (
    <Card>
        <Column alignItems="center">
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id={id} />
            </Text>
        </Column>
    </Card>
);
