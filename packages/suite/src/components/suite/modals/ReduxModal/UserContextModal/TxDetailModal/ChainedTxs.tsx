import styled from 'styled-components';

import { WalletAccountTransaction } from '@suite-common/wallet-types';

import { TrezorLink } from 'src/components/suite';
import { TransactionItem } from 'src/components/wallet/TransactionItem/TransactionItem';
import { Network } from 'src/types/wallet';

const Wrapper = styled.div`
    text-align: left;
    margin-top: 25px;
`;

const StyledTrezorLink = styled(TrezorLink)`
    width: 100%;
`;

const ChainedTransactionItem = styled(TransactionItem)`
    width: 100%;
    padding: 0 40px;
    cursor: pointer;

    &:hover {
        background: ${({ theme }) => theme.BG_GREY};
    }
`;

interface ChainedTxsProps {
    txs: WalletAccountTransaction[];
    network: Network;
    explorerUrl: string;
}

export const ChainedTxs = ({ txs, network, explorerUrl }: ChainedTxsProps) => (
    <Wrapper>
        {txs.map((tx, index) => (
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
    </Wrapper>
);
