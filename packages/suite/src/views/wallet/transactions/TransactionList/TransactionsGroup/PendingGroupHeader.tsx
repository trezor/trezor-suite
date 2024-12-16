import { InfoSegments, Text } from '@trezor/components';

import { Translation } from 'src/components/suite';

type PendingGroupHeaderProps = { txsCount: number };

export const PendingGroupHeader = ({ txsCount }: PendingGroupHeaderProps) => {
    return (
        <Text variant="warning" data-testid="@transaction-group/pending/count">
            <InfoSegments>
                <Translation id="TR_PENDING_TX_HEADING" values={{ count: txsCount }} />
                {txsCount}
            </InfoSegments>
        </Text>
    );
};
