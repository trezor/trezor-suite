import styled from 'styled-components';
import { Button } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useRbfContext } from 'src/hooks/wallet/useRbfForm';
import { GreyCard } from './GreyCard';
import { WarnHeader } from './WarnHeader';
import { AffectedTransactionItem } from './AffectedTransactionItem';

const ChainedTxs = styled.div`
    display: flex;
    flex-direction: column;
    padding-top: 24px;
    margin-top: 24px;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
`;

export const AffectedTransactions = ({ showChained }: { showChained: () => void }) => {
    const { chainedTxs } = useRbfContext();
    if (!chainedTxs) return null;

    return (
        <GreyCard>
            <WarnHeader
                action={
                    <Button
                        variant="tertiary"
                        onClick={showChained}
                        icon="ARROW_RIGHT"
                        alignIcon="right"
                    >
                        <Translation id="TR_SEE_DETAILS" />
                    </Button>
                }
            >
                <Translation id="TR_AFFECTED_TXS" />
            </WarnHeader>
            <ChainedTxs>
                {chainedTxs.own.map(tx => (
                    <AffectedTransactionItem key={tx.txid} tx={tx} isAccountOwned />
                ))}
                {chainedTxs.others.map(tx => (
                    <AffectedTransactionItem key={tx.txid} tx={tx} />
                ))}
            </ChainedTxs>
        </GreyCard>
    );
};
