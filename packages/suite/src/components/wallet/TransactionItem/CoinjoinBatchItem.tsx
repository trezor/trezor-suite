import styled, { css } from 'styled-components';
import BigNumber from 'bignumber.js';

import {
    formatNetworkAmount,
    isTestnet,
    sumTransactions,
    sumTransactionsFiat,
} from '@suite-common/wallet-utils';
import { useFormatters } from '@suite-common/formatters';
import { variables, CollapsibleBox } from '@trezor/components';

import { useDispatch } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { WalletAccountTransaction } from 'src/types/wallet/index';
import { HiddenPlaceholder, Translation } from 'src/components/suite';
import { TransactionTimestamp } from 'src/components/wallet/TransactionTimestamp';

import { TransactionTypeIcon } from './TransactionTypeIcon';
import { TransactionTargetLayout } from './TransactionTargetLayout';
import {
    Content,
    Description,
    NextRow,
    StyledFormattedCryptoAmount,
    TargetsWrapper,
    TimestampWrapper,
    TxTypeIconWrapper,
} from './CommonComponents';
import { borders } from '@trezor/theme';

const CryptoAmount = styled(StyledFormattedCryptoAmount)`
    width: unset;
`;

const RoundRow = styled.div`
    display: flex;
    align-items: center;
    padding: 8px 16px;
    border-radius: ${borders.radii.xs};
    cursor: pointer;

    :hover {
        background-color: ${({ theme }) => theme.BG_GREY};
    }

    > div:first-child {
        margin-right: 28px;
    }
`;

const Round = ({ transaction }: { transaction: WalletAccountTransaction }) => {
    const dispatch = useDispatch();

    const transactionAmount = new BigNumber(transaction.amount);

    const openTransactionDetail = () =>
        dispatch(
            openModal({
                type: 'transaction-detail',
                tx: transaction,
            }),
        );

    return (
        <RoundRow onClick={openTransactionDetail}>
            <TransactionTypeIcon type="joint" isPending={false} size={20} />
            <TransactionTimestamp transaction={transaction} />
            <TransactionTargetLayout
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
                            transactionAmount.abs().toString(),
                            transaction.symbol,
                        )}
                        symbol={transaction.symbol}
                        signValue={transactionAmount}
                    />
                }
                isFirst
                isLast
            />
        </RoundRow>
    );
};

const StyledCollapsibleBox = styled(CollapsibleBox)<{ isPending: boolean }>`
    background-color: ${({ theme }) => theme.BG_WHITE};
    box-shadow: none;
    border-radius: 12px;
    margin-bottom: 0;

    ${CollapsibleBox.Header} {
        padding: 12px 24px;

        ${variables.SCREEN_QUERY.MOBILE} {
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
        transition: all 0.2s ease-in-out;
        transition-property: margin-left, opacity;
    }

    ${CollapsibleBox.Heading} {
        flex: 1;
        align-items: initial;
    }

    ${CollapsibleBox.Content} {
        padding: 8px;
    }

    ${({ isPending }) =>
        isPending &&
        css`
            border-left: 8px solid ${({ theme }) => theme.TYPE_ORANGE};

            > div {
                margin-left: -8px;
            }

            ${CollapsibleBox.Content} {
                margin-left: 8px;
            }

            ${variables.SCREEN_QUERY.MOBILE} {
                > div {
                    margin-left: -8px;
                }
            }
        `}
`;

type CoinjoinBatchItemProps = {
    transactions: WalletAccountTransaction[];
    localCurrency: string;
    isPending: boolean;
};

export const CoinjoinBatchItem = ({
    transactions,
    localCurrency,
    isPending,
}: CoinjoinBatchItemProps) => {
    const lastTx = transactions[0];
    const amount = sumTransactions(transactions);
    const fiatAmount = sumTransactionsFiat(transactions, localCurrency);
    const { FiatAmountFormatter } = useFormatters();
    const isMissingFiatRates = transactions.some(tx => !tx.rates?.[localCurrency]);

    return (
        <StyledCollapsibleBox
            variant="large"
            isPending={isPending}
            heading={
                <>
                    <TxTypeIconWrapper>
                        <TransactionTypeIcon type="joint" isPending={isPending} />
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
                                <TransactionTargetLayout
                                    addressLabel={
                                        <Translation
                                            id="TR_N_TRANSACTIONS"
                                            values={{ value: transactions.length }}
                                        />
                                    }
                                    fiatAmount={
                                        !isTestnet(lastTx.symbol) && !isMissingFiatRates ? (
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
