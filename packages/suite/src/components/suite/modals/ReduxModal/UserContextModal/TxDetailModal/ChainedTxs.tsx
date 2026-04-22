import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { type AccountType, type Network } from '@suite-common/wallet-config';
import { type ChainedTransactions, createAccountKey } from '@suite-common/wallet-types';
import { typography } from '@trezor/theme';

import { TrezorLink } from 'src/components/suite/TrezorLink';
import { TransactionItem } from 'src/components/wallet/TransactionItem/TransactionItem';

import { AffectedTransactionItem } from './AffectedTransactions/AffectedTransactionItem';

const Wrapper = styled.div`
    text-align: left;
    margin-top: 25px;
`;

const Header = styled.div`
    color: ${({ theme }) => theme.contentPrimary};
    ${typography['body-sm']}
    padding: 0 20px;
`;

const Label = styled(Header)`
    color: ${({ theme }) => theme.contentSecondary};
    padding: 12px 20px;
`;

const ChainedTransactionItem = styled(TransactionItem)`
    width: 100%;
    cursor: pointer;
    border-left: 0;

    &:hover {
        background: ${({ theme }) => theme.legacyBackgroundNeutralBoldInverted};
    }
`;

const StyledAffectedTransactionItem = styled(AffectedTransactionItem)`
    width: 100%;
    cursor: pointer;
    padding: 20px;
    border-radius: 12px;

    &:hover {
        background: ${({ theme }) => theme.legacyBackgroundNeutralBoldInverted};
    }
`;

interface ChainedTxsProps {
    txs: ChainedTransactions;
    network: Network;
    accountType: AccountType;
    explorerUrl: string;
}

export const ChainedTxs = ({ txs, network, accountType, explorerUrl }: ChainedTxsProps) => (
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
            <TrezorLink key={tx.txid} href={`${explorerUrl}${tx.txid}`}>
                <ChainedTransactionItem
                    key={tx.txid}
                    transaction={tx}
                    network={network}
                    accountType={accountType}
                    isPending
                    isActionDisabled
                    accountKey={createAccountKey({
                        accountDescriptor: tx.descriptor,
                        networkSymbol: tx.symbol,
                        deviceStaticSessionId: tx.deviceState,
                    })}
                    index={index}
                />
            </TrezorLink>
        ))}

        {txs.others.length > 0 && (
            <Label>
                <Translation id="TR_AFFECTED_TXS_OTHERS" />
            </Label>
        )}
        {txs.others.map(tx => (
            <TrezorLink key={tx.txid} href={`${explorerUrl}${tx.txid}`}>
                <StyledAffectedTransactionItem tx={tx} />
            </TrezorLink>
        ))}
    </Wrapper>
);
