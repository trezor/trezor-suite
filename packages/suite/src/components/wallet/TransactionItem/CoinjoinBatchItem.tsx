import React from 'react';
import styled from 'styled-components';

import {
    formatNetworkAmount,
    isTestnet,
    sumTransactions,
    sumTransactionsFiat,
} from '@suite-common/wallet-utils';
import { useFormatters } from '@suite-common/formatters';
import { variables, CollapsibleBox } from '@trezor/components';

import { useActions } from '@suite-hooks/useActions';
import * as modalActions from '@suite-actions/modalActions';
import { WalletAccountTransaction } from '@wallet-types/index';
import { HiddenPlaceholder, Translation } from '@suite-components';
import { TransactionTimestamp } from '@wallet-components/TransactionTimestamp';

import { StyledCryptoAmount } from './components/Target';
import { TransactionTypeIcon } from './components/TransactionTypeIcon';
import { BaseTargetLayout } from './components/BaseTargetLayout';
import {
    Content,
    Description,
    NextRow,
    TargetsWrapper,
    TimestampWrapper,
    TxTypeIconWrapper,
} from './components/CommonComponents';

const CryptoAmount = styled(StyledCryptoAmount)`
    width: unset;
`;

const RoundRow = styled.div`
    display: flex;
    align-items: center;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;

    :hover {
        background-color: ${({ theme }) => theme.BG_GREY};
    }

    > div:first-child {
        margin-right: 28px;
    }
`;

const Round = ({ transaction }: { transaction: WalletAccountTransaction }) => {
    const { openModal } = useActions({ openModal: modalActions.openModal });
    return (
        <RoundRow
            onClick={() =>
                openModal({
                    type: 'transaction-detail',
                    tx: transaction,
                })
            }
        >
            <TransactionTypeIcon type="joint" isPending={false} size={20} />
            <TransactionTimestamp transaction={transaction} />
            <BaseTargetLayout
                addressLabel={
                    <Translation
                        id="TR_JOINT_TRANSACTION_TARGET"
                        values={{
                            in: transaction.details.vin.length,
                            inMy: transaction.details.vin.filter(v => v.isAccountOwned).length,
                            out: transaction.details.vout.length,
                            outMy: transaction.details.vout.filter(v => v.isAccountOwned).length,
                        }}
                    />
                }
                amount={
                    <CryptoAmount
                        value={formatNetworkAmount(
                            transaction.amount.startsWith('-')
                                ? transaction.amount.slice(1)
                                : transaction.amount,
                            transaction.symbol,
                        )}
                        symbol={transaction.symbol}
                        signValue={transaction.amount}
                    />
                }
                isFirst
                isLast
            />
        </RoundRow>
    );
};

const StyledCollapsibleBox = styled(CollapsibleBox)`
    background-color: ${props => props.theme.BG_WHITE};
    box-shadow: none;
    border-radius: 12px;
    margin-bottom: 0;

    ${CollapsibleBox.Header} {
        padding: 12px 24px;

        @media (max-width: ${variables.SCREEN_SIZE.SM}) {
            padding: 12px 16px;
        }

        :not(:hover) {
            ${CollapsibleBox.IconWrapper} {
                margin-left: -20px;
                opacity: 0;
            }
        }
    }

    ${CollapsibleBox.IconWrapper} {
        transition: all 0.25s ease-in-out;
        transition-property: margin-left, opacity;
    }

    ${CollapsibleBox.Heading} {
        flex: 1;
        align-items: initial;
    }

    ${CollapsibleBox.Content} {
        padding: 8px;
    }
`;

type CoinjoinBatchItemProps = {
    transactions: WalletAccountTransaction[];
    localCurrency: string;
};

export const CoinjoinBatchItem = ({ transactions, localCurrency }: CoinjoinBatchItemProps) => {
    const lastTx = transactions[0];
    const amount = sumTransactions(transactions);
    const fiatAmount = sumTransactionsFiat(transactions, localCurrency);
    const { FiatAmountFormatter } = useFormatters();
    return (
        <StyledCollapsibleBox
            variant="large"
            heading={
                <>
                    <TxTypeIconWrapper>
                        <TransactionTypeIcon type="joint" isPending={false} />
                    </TxTypeIconWrapper>
                    <Content>
                        <Description>
                            <Translation id="TR_COINJOIN_TRANSACTION_BATCH" />
                            <CryptoAmount
                                value={amount.absoluteValue().toFixed()}
                                symbol={lastTx.symbol}
                                signValue={amount}
                            />
                        </Description>
                        <NextRow>
                            <TimestampWrapper>
                                <TransactionTimestamp transaction={lastTx} />
                            </TimestampWrapper>
                            <TargetsWrapper>
                                <BaseTargetLayout
                                    addressLabel={
                                        <Translation
                                            id="TR_N_TRANSACTIONS"
                                            values={{ value: transactions.length }}
                                        />
                                    }
                                    fiatAmount={
                                        !isTestnet(lastTx.symbol) ? (
                                            <HiddenPlaceholder>
                                                <FiatAmountFormatter
                                                    currency={localCurrency}
                                                    value={fiatAmount.absoluteValue().toFixed()}
                                                />
                                            </HiddenPlaceholder>
                                        ) : undefined
                                    }
                                    singleRowLayout
                                    isFirst
                                    isLast
                                />
                            </TargetsWrapper>
                        </NextRow>
                    </Content>
                </>
            }
        >
            {transactions.map(tx => (
                <Round key={tx.txid} transaction={tx} />
            ))}
        </StyledCollapsibleBox>
    );
};
