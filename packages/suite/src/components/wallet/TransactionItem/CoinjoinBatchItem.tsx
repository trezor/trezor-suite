import styled from 'styled-components';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import {
    formatNetworkAmount,
    getFiatRateKey,
    isTestnet,
    roundTimestampToNearestPastHour,
    sumTransactions,
    sumTransactionsFiat,
} from '@suite-common/wallet-utils';
import { useFormatters } from '@suite-common/formatters';
import { CollapsibleBox } from '@trezor/components';

import { useDispatch, useSelector } from 'src/hooks/suite';
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
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { selectHistoricFiatRates } from '@suite-common/wallet-core';
import { Timestamp } from '@suite-common/wallet-types';

const CryptoAmount = styled(StyledFormattedCryptoAmount)`
    width: unset;
`;

const RoundRow = styled.div`
    display: flex;
    align-items: center;
    padding: 8px 16px;
    border-radius: ${borders.radii.xs};
    cursor: pointer;

    &:hover {
        background-color: ${({ theme }) => theme.legacy.BG_GREY};
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

type CoinjoinBatchItemProps = {
    transactions: WalletAccountTransaction[];
    localCurrency: FiatCurrencyCode;
    isPending: boolean;
};

export const CoinjoinBatchItem = ({
    transactions,
    localCurrency,
    isPending,
}: CoinjoinBatchItemProps) => {
    const lastTx = transactions[0];
    const { FiatAmountFormatter } = useFormatters();
    const historicFiatRates = useSelector(selectHistoricFiatRates);
    const amount = sumTransactions(transactions);
    const fiatAmount = sumTransactionsFiat(transactions, localCurrency, historicFiatRates);
    const isMissingFiatRates = transactions.some(tx => {
        const fiatRateKey = getFiatRateKey(tx.symbol, localCurrency);
        const roundedTimestamp = roundTimestampToNearestPastHour(tx.blockTime as Timestamp);
        const historicRate = historicFiatRates?.[fiatRateKey]?.[roundedTimestamp];

        return historicRate === undefined || historicRate === 0;
    });

    return (
        <CollapsibleBox
            paddingType="large"
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
        </CollapsibleBox>
    );
};
