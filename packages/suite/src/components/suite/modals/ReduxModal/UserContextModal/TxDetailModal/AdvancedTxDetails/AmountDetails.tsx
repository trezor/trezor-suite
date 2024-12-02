import { Table, Text } from '@trezor/components';
import {
    formatAmount,
    formatCardanoDeposit,
    formatCardanoWithdrawal,
    formatNetworkAmount,
    getFiatRateKey,
    getTxOperation,
    isTxFeePaid,
    roundTimestampToNearestPastHour,
    isStakeTypeTx,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import {
    selectHistoricFiatRates,
    selectHistoricFiatRatesByTimestamp,
} from '@suite-common/wallet-core';
import { Timestamp, TokenAddress } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { WalletAccountTransaction } from 'src/types/wallet';
import { Translation, FormattedCryptoAmount, FiatValue, FormattedDate } from 'src/components/suite';
import { AmountComponent } from 'src/components/wallet/AmountComponent';

type AmountDetailsProps = {
    tx: WalletAccountTransaction;
    isTestnet: boolean;
};

// TODO: Do not show FEE for sent but not mine transactions
export const AmountDetails = ({ tx, isTestnet }: AmountDetailsProps) => {
    const fiatCurrencyCode = useSelector(selectLocalCurrency);
    const fiatRateKey = getFiatRateKey(tx.symbol, fiatCurrencyCode);

    const historicRate = useSelector(state =>
        selectHistoricFiatRatesByTimestamp(state, fiatRateKey, tx.blockTime as Timestamp),
    );

    const historicFiatRates = useSelector(selectHistoricFiatRates);

    const amount = new BigNumber(formatNetworkAmount(tx.amount, tx.symbol));
    const fee = formatNetworkAmount(tx.fee, tx.symbol);
    const cardanoWithdrawal = formatCardanoWithdrawal(tx);
    const cardanoDeposit = formatCardanoDeposit(tx);
    const { selectedAccount } = useSelector(state => state.wallet);

    const txSignature = tx.ethereumSpecific?.parsedData?.methodId;
    const isStakeTypeTxNoAmount = isStakeTypeTx(txSignature) && amount.eq(0);

    return (
        <Table hasBorders={false} isRowHighlightedOnHover={false} typographyStyle="hint">
            {!isTestnet && (
                <Table.Header>
                    <Table.Row>
                        <Table.Cell colSpan={3} align="right">
                            {tx.blockTime && (
                                <FormattedDate value={new Date(tx.blockTime * 1000)} date />
                            )}
                        </Table.Cell>
                        <Table.Cell align="right">
                            <Translation
                                id="TR_TODAY_DATE"
                                values={{
                                    date: (
                                        <FiatValue amount="1" symbol={tx.symbol}>
                                            {({ timestamp }) =>
                                                timestamp ? (
                                                    <FormattedDate
                                                        value={timestamp}
                                                        date
                                                        year={undefined}
                                                    />
                                                ) : null
                                            }
                                        </FiatValue>
                                    ),
                                }}
                            />
                        </Table.Cell>
                    </Table.Row>
                </Table.Header>
            )}
            {/* AMOUNT */}
            <Table.Body>
                {!isStakeTypeTxNoAmount && (tx.targets.length || tx.type === 'joint') && (
                    <Table.Row>
                        <Table.Cell>
                            <Text variant="tertiary">
                                <Translation id="AMOUNT" />
                            </Text>
                        </Table.Cell>
                        <Table.Cell>
                            <Text variant="default">
                                <FormattedCryptoAmount
                                    value={amount.abs().toString()}
                                    symbol={tx.symbol}
                                    signValue={
                                        getTxOperation(tx.type, true) ||
                                        (amount.isLessThan(0) ? 'negative' : 'positive')
                                    }
                                />
                            </Text>
                        </Table.Cell>
                        <Table.Cell align="right">
                            <Text variant="default">
                                <FiatValue
                                    amount={amount.abs().toString()}
                                    symbol={tx.symbol}
                                    historicRate={historicRate}
                                    useHistoricRate
                                />
                            </Text>
                        </Table.Cell>
                        <Table.Cell align="right">
                            <Text variant="default">
                                <FiatValue amount={amount.abs().toString()} symbol={tx.symbol} />
                            </Text>
                        </Table.Cell>
                    </Table.Row>
                )}
                {tx.internalTransfers.map((transfer, i) => (
                    <Table.Row key={i}>
                        <Table.Cell>
                            {i === 0 && (!tx.targets.length || isStakeTypeTxNoAmount) ? (
                                <Text variant="tertiary">
                                    <Translation id="AMOUNT" />
                                </Text>
                            ) : undefined}
                        </Table.Cell>
                        <Table.Cell>
                            <Text variant="default">
                                <FormattedCryptoAmount
                                    value={formatNetworkAmount(transfer.amount, tx.symbol)}
                                    symbol={tx.symbol}
                                    signValue={getTxOperation(transfer.type, true)}
                                />
                            </Text>
                        </Table.Cell>
                        <Table.Cell align="right">
                            <Text variant="default">
                                <FiatValue
                                    amount={formatNetworkAmount(transfer.amount, tx.symbol)}
                                    symbol={tx.symbol}
                                    historicRate={historicRate}
                                    useHistoricRate
                                />
                            </Text>
                        </Table.Cell>
                        <Table.Cell align="right">
                            <Text variant="default">
                                <FiatValue
                                    amount={formatNetworkAmount(transfer.amount, tx.symbol)}
                                    symbol={tx.symbol}
                                />
                            </Text>
                        </Table.Cell>
                    </Table.Row>
                ))}
                {tx.tokens.map((transfer, i) => {
                    const tokenFiatRateKey = getFiatRateKey(
                        tx.symbol,
                        fiatCurrencyCode,
                        transfer.contract as TokenAddress,
                    );
                    const roundedTimestamp = roundTimestampToNearestPastHour(
                        tx.blockTime as Timestamp,
                    );
                    const historicTokenRate =
                        historicFiatRates?.[tokenFiatRateKey]?.[roundedTimestamp];

                    return (
                        <Table.Row key={i}>
                            <Table.Cell>
                                {i === 0 && !tx.targets.length && !tx.internalTransfers.length ? (
                                    <Text variant="tertiary">
                                        <Translation id="AMOUNT" />
                                    </Text>
                                ) : undefined}
                            </Table.Cell>
                            <Table.Cell>
                                <Text variant="default">
                                    <AmountComponent
                                        transfer={transfer}
                                        withLink={true}
                                        withSign={true}
                                        alignMultitoken="flex-start"
                                    />
                                </Text>
                            </Table.Cell>
                            <Table.Cell align="right">
                                {selectedAccount.account && (
                                    <Text variant="default">
                                        <FiatValue
                                            amount={formatAmount(
                                                transfer.amount,
                                                transfer.decimals,
                                            )}
                                            symbol={selectedAccount.account?.symbol}
                                            tokenAddress={transfer.contract as TokenAddress}
                                            historicRate={historicTokenRate}
                                            useHistoricRate
                                        />
                                    </Text>
                                )}
                            </Table.Cell>
                            <Table.Cell align="right">
                                {selectedAccount.account && (
                                    <Text variant="default">
                                        <FiatValue
                                            amount={formatAmount(
                                                transfer.amount,
                                                transfer.decimals,
                                            )}
                                            symbol={selectedAccount.account.symbol}
                                            tokenAddress={transfer.contract as TokenAddress}
                                        />
                                    </Text>
                                )}
                            </Table.Cell>
                        </Table.Row>
                    );
                })}
                {cardanoWithdrawal && (
                    <Table.Row>
                        <Table.Cell>
                            <Text variant="tertiary">
                                <Translation id="TR_TX_WITHDRAWAL" />
                            </Text>
                        </Table.Cell>
                        <Table.Cell>
                            <Text variant="default">
                                <FormattedCryptoAmount
                                    value={cardanoWithdrawal}
                                    symbol={tx.symbol}
                                    signValue="negative"
                                />
                            </Text>
                        </Table.Cell>
                        <Table.Cell align="right">
                            <Text variant="default">
                                <FiatValue
                                    amount={cardanoWithdrawal}
                                    symbol={tx.symbol}
                                    historicRate={historicRate}
                                    useHistoricRate
                                />
                            </Text>
                        </Table.Cell>
                        <Table.Cell align="right">
                            <Text variant="default">
                                <FiatValue amount={cardanoWithdrawal} symbol={tx.symbol} />
                            </Text>
                        </Table.Cell>
                    </Table.Row>
                )}
                {cardanoDeposit && (
                    <Table.Row>
                        <Table.Cell>
                            <Text variant="tertiary">
                                <Translation id="TR_TX_DEPOSIT" />
                            </Text>
                        </Table.Cell>
                        <Table.Cell>
                            <Text variant="default">
                                <FormattedCryptoAmount
                                    value={cardanoDeposit}
                                    symbol={tx.symbol}
                                    signValue="positive"
                                />
                            </Text>
                        </Table.Cell>
                        <Table.Cell align="right">
                            <Text variant="default">
                                <FiatValue
                                    amount={cardanoDeposit}
                                    symbol={tx.symbol}
                                    historicRate={historicRate}
                                    useHistoricRate
                                />
                            </Text>
                        </Table.Cell>
                        <Table.Cell align="right">
                            <Text variant="default">
                                <FiatValue amount={cardanoDeposit} symbol={tx.symbol} />
                            </Text>
                        </Table.Cell>
                    </Table.Row>
                )}
                {/* TX FEE */}
                {isTxFeePaid(tx) && (
                    <Table.Row>
                        <Table.Cell>
                            <Text variant="tertiary">
                                <Translation id="TR_TX_FEE" />
                            </Text>
                        </Table.Cell>
                        <Table.Cell>
                            <Text variant="default">
                                <FormattedCryptoAmount
                                    value={fee}
                                    symbol={tx.symbol}
                                    signValue="negative"
                                />
                            </Text>
                        </Table.Cell>
                        <Table.Cell align="right">
                            <Text variant="default">
                                <FiatValue
                                    amount={fee}
                                    symbol={tx.symbol}
                                    historicRate={historicRate}
                                    useHistoricRate
                                />
                            </Text>
                        </Table.Cell>
                        <Table.Cell align="right">
                            <Text variant="default">
                                <FiatValue amount={fee} symbol={tx.symbol} />
                            </Text>
                        </Table.Cell>
                    </Table.Row>
                )}
            </Table.Body>
        </Table>
    );
};
