import { Translation } from 'src/components/suite';
import { ColPending, HeaderWrapper } from './CommonComponents';

type PendingGroupHeaderProps = { txsCount: number };

export const PendingGroupHeader = ({ txsCount }: PendingGroupHeaderProps) => {
    return (
        <HeaderWrapper>
            <ColPending data-testid="@transaction-group/pending/count">
                <Translation id="TR_PENDING_TX_HEADING" values={{ count: txsCount }} /> • {txsCount}
            </ColPending>
        </HeaderWrapper>
    );
};
