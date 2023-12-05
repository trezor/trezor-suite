import styled from 'styled-components';

import { variables } from '@trezor/components';
import { ChainedTransactions } from '@suite-common/wallet-types';

import { TrezorLink, Translation } from 'src/components/suite';
import { TransactionItem } from 'src/components/wallet/TransactionItem/TransactionItem';
import { Network } from 'src/types/wallet';
import { AffectedTransactionItem } from './ChangeFee/AffectedTransactionItem';

const Wrapper = styled.div`
    text-align: left;
    margin-top: 25px;
`;

const Header = styled.div`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    padding: 0 20px;
`;

const Label = styled(Header)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    padding: 12px 20px;
`;

const StyledTrezorLink = styled(TrezorLink)`
    width: 100%;
`;

const ChainedTransactionItem = styled(TransactionItem)`
    width: 100%;
    cursor: pointer;
    border-left: 0;

    &:hover {
        background: ${({ theme }) => theme.BG_GREY};
    }
`;

const StyledAffectedTransactionItem = styled(AffectedTransactionItem)`
    width: 100%;
    cursor: pointer;
    padding: 20px;
    border-radius: 12px;

    &:hover {
        background: ${({ theme }) => theme.BG_GREY};
    }
`;

interface ChainedTxsProps {
    txs: ChainedTransactions;
    network: Network;
    explorerUrl: string;
}

export const ChainedTxs = ({ txs, network, explorerUrl }: ChainedTxsProps) => (
    <Wrapper>
        <Header>
            <Translation id="TR_AFFECTED_TXS_HEADER" />
        </Header>

        {txs.own.length > 0 && (
            <Label>
                <Translation id="TR_AFFECTED_TXS_OWN" />
            </Label>
        )}
        {txs.own.map((tx, index) => (
            <StyledTrezorLink key={tx.txid} href={`${explorerUrl}${tx.txid}`} variant="nostyle">
                <ChainedTransactionItem
                    key={tx.txid}
                    transaction={tx}
                    network={network}
                    isPending
                    isActionDisabled
                    accountKey={`${tx.descriptor}-${tx.symbol}-${tx.deviceState}`}
                    index={index}
                />
            </StyledTrezorLink>
        ))}

        {txs.others.length > 0 && (
            <Label>
                <Translation id="TR_AFFECTED_TXS_OTHERS" />
            </Label>
        )}
        {txs.others.map(tx => (
            <StyledTrezorLink key={tx.txid} href={`${explorerUrl}${tx.txid}`} variant="nostyle">
                <StyledAffectedTransactionItem tx={tx} />
            </StyledTrezorLink>
        ))}
    </Wrapper>
);
