import { Translation } from '@suite-lego/intl';
import { InfoSegments, Text } from '@trezor/components';

type PendingGroupHeaderProps = { txsCount: number };

export const PendingGroupHeader = ({ txsCount }: PendingGroupHeaderProps) => (
    <Text intent="warning" data-testid="@transaction-group/pending/count">
        <InfoSegments>
            <Translation id="TR_PENDING_TX_HEADING" values={{ count: txsCount }} />
            {txsCount}
        </InfoSegments>
    </Text>
);
