import { Translation } from '@suite/intl';
import {
    selectBaseCurrency,
    selectHistoricFiatRates,
    selectHistoricFiatRatesByTimestamp,
} from '@suite-common/wallet-core';
import { type Timestamp, type TokenAddress } from '@suite-common/wallet-types';
import {
    convertAmountSubunitsToUnits,
    formatCardanoDeposit,
    formatCardanoWithdrawal,
    formatNetworkAmount,
    getCardanoStakingSignValue,
    getFiatRateKey,
    getTxOperation,
    isStakeTypeTx,
    isTxFeePaid,
    roundTimestampToNearestPastHour,
} from '@suite-common/wallet-utils';
import { Table, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { FormattedDate } from 'src/components/suite/FormattedDate';
import { AmountComponent } from 'src/components/wallet/AmountComponent';
import { useSelector } from 'src/hooks/suite';
import { type WalletAccountTransaction } from 'src/types/wallet';

type AmountDetailsProps = {
    tx: WalletAccountTransaction;
    isTestnet: boolean;
};

// TODO: Do not show FEE for sent but not mine transactions
export const AmountDetails = ({ tx, isTestnet }: AmountDetailsProps) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const fiatRateKey = getFiatRateKey(tx.symbol, baseCurrencyCode);

    const historicRate = useSelector(state =>
        selectHistoricFiatRatesByTimestamp(state, fiatRateKey, tx.blockTime as Timestamp),
    );

    const historicFiatRates = useSelector(selectHistoricFiatRates);

    const fee = formatNetworkAmount(tx.fee, tx.symbol);
    const amount = new BigNumber(formatNetworkAmount(tx.amount, tx.symbol));
    const displayAmount = tx.blockHash ? amount : amount.minus(fee);
    const cardanoWithdrawal = formatCardanoWithdrawal(tx);
    const cardanoDeposit = formatCardanoDeposit(tx);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    const txSignature = tx.ethereumSpecific?.parsedData?.methodId;
    const isStakeType = isStakeTypeTx(txSignature) || tx?.solanaSpecific?.stakeOperation?.type; // ethereum or solana staking tx
    const isStakeTypeTxNoAmount = isStakeType && amount.eq(0);

    const getAmountSignValue = () => {
        const txOp = getTxOperation(tx.type, true);

        if (txOp) return txOp;

        if (amount.isZero()) {
            return undefined;
        }

        return amount.isNegative() ? 'negative' : 'positive';
    };

    return (
        <Table hasBorders={false} isRowHighlightedOnHover={false} typographyStyle="body-sm">
            {!isTestnet && (
                <Table.Header>
                    <Table.Row>
                        <Table.Cell colSpan={3} align="end">
                            {tx.blockTime && (
                                <FormattedDate value={new Date(tx.blockTime * 1000)} date />
                            )}
                        </Table.Cell>
                        <Table.Cell align="end">
                            <Translation
                                id="TR_TODAY_DATE"
                                values={{
                                    date: (
                                        <BaseCurrencyValue amount="1" symbol={tx.symbol}>
                                            {({ timestamp }) =>
                                                timestamp ? (
                                                    <FormattedDate
                                                        value={timestamp}
                                                        date
                                                        year={undefined}
                                                    />
                                                ) : null
                                            }
                                        </BaseCurrencyValue>
                                    ),
                                }}
                            />
                        </Table.Cell>
                    </Table.Row>
                </Table.Header>
            )}
            {/* AMOUNT */}
            <Table.Body>
                {!isStakeTypeTxNoAmount &&
                    tx.type !== 'self' &&
                    !amount.isZero() &&
                    (tx.targets.length || tx.type === 'joint') && (
                        <Table.Row>
                            <Table.Cell>
                                <Text intent="neutral" priority="secondary">
                                    <Translation id="AMOUNT" />
                                </Text>
                            </Table.Cell>
                            <Table.Cell align="end">
                                <Text intent="neutral">
                                    <FormattedCryptoAmount
                                        value={displayAmount.abs().toString()}
                                        symbol={tx.symbol}
                                        signValue={getAmountSignValue()}
                                    />
                                </Text>
                            </Table.Cell>
                            <Table.Cell align="end">
                                <Text intent="neutral">
                                    <BaseCurrencyValue
                                        amount={displayAmount.abs().toString()}
                                        symbol={tx.symbol}
                                        historicRate={historicRate}
                                        useHistoricRate
                                    />
                                </Text>
                            </Table.Cell>
                            <Table.Cell align="end">
                                <Text intent="neutral">
                                    <BaseCurrencyValue
                                        amount={displayAmount.abs().toString()}
                                        symbol={tx.symbol}
                                    />
                                </Text>
                            </Table.Cell>
                        </Table.Row>
                    )}
                {tx.internalTransfers.map((transfer, i) => (
                    <Table.Row key={i}>
                        <Table.Cell>
                            {i === 0 && (!tx.targets.length || isStakeTypeTxNoAmount) ? (
                                <Text intent="neutral" priority="secondary">
                                    <Translation id="AMOUNT" />
                                </Text>
                            ) : undefined}
                        </Table.Cell>
                        <Table.Cell align="end">
                            <Text intent="neutral">
                                <FormattedCryptoAmount
                                    value={formatNetworkAmount(transfer.amount, tx.symbol)}
                                    symbol={tx.symbol}
                                    signValue={getTxOperation(transfer.type, true)}
                                />
                            </Text>
                        </Table.Cell>
                        <Table.Cell align="end">
                            <Text intent="neutral">
                                <BaseCurrencyValue
                                    amount={formatNetworkAmount(transfer.amount, tx.symbol)}
                                    symbol={tx.symbol}
                                    historicRate={historicRate}
                                    useHistoricRate
                                />
                            </Text>
                        </Table.Cell>
                        <Table.Cell align="end">
                            <Text intent="neutral">
                                <BaseCurrencyValue
                                    amount={formatNetworkAmount(transfer.amount, tx.symbol)}
                                    symbol={tx.symbol}
                                />
                            </Text>
                        </Table.Cell>
                    </Table.Row>
                ))}
                {tx.type !== 'self' &&
                    tx.tokens.map((transfer, i) => {
                        const tokenFiatRateKey = getFiatRateKey(
                            tx.symbol,
                            baseCurrencyCode,
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
                                    {i === 0 &&
                                    !tx.targets.length &&
                                    !tx.internalTransfers.length ? (
                                        <Text intent="neutral" priority="secondary">
                                            <Translation id="AMOUNT" />
                                        </Text>
                                    ) : undefined}
                                </Table.Cell>
                                <Table.Cell align="end">
                                    <Text intent="neutral">
                                        <AmountComponent
                                            transfer={transfer}
                                            withLink={true}
                                            withSign={true}
                                            alignMultitoken="flex-start"
                                            linkTypographyStyle="body-sm"
                                        />
                                    </Text>
                                </Table.Cell>
                                <Table.Cell align="end">
                                    {selectedAccount.account && (
                                        <Text intent="neutral">
                                            <BaseCurrencyValue
                                                amount={convertAmountSubunitsToUnits(
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
                                <Table.Cell align="end">
                                    {selectedAccount.account && (
                                        <Text intent="neutral">
                                            <BaseCurrencyValue
                                                amount={convertAmountSubunitsToUnits(
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
                            <Text intent="neutral" priority="secondary">
                                <Translation id="TR_TX_WITHDRAWAL" />
                            </Text>
                        </Table.Cell>
                        <Table.Cell align="end">
                            <Text intent="neutral">
                                <FormattedCryptoAmount
                                    value={cardanoWithdrawal}
                                    symbol={tx.symbol}
                                    signValue={getCardanoStakingSignValue(tx)}
                                />
                            </Text>
                        </Table.Cell>
                        <Table.Cell align="end">
                            <Text intent="neutral">
                                <BaseCurrencyValue
                                    amount={cardanoWithdrawal}
                                    symbol={tx.symbol}
                                    historicRate={historicRate}
                                    useHistoricRate
                                />
                            </Text>
                        </Table.Cell>
                        <Table.Cell align="end">
                            <Text intent="neutral">
                                <BaseCurrencyValue amount={cardanoWithdrawal} symbol={tx.symbol} />
                            </Text>
                        </Table.Cell>
                    </Table.Row>
                )}
                {cardanoDeposit && (
                    <Table.Row>
                        <Table.Cell>
                            <Text intent="neutral" priority="secondary">
                                <Translation id="TR_TX_DEPOSIT" />
                            </Text>
                        </Table.Cell>
                        <Table.Cell align="end">
                            <Text intent="neutral">
                                <FormattedCryptoAmount
                                    value={cardanoDeposit}
                                    symbol={tx.symbol}
                                    signValue={getCardanoStakingSignValue(tx)}
                                />
                            </Text>
                        </Table.Cell>
                        <Table.Cell align="end">
                            <Text intent="neutral">
                                <BaseCurrencyValue
                                    amount={cardanoDeposit}
                                    symbol={tx.symbol}
                                    historicRate={historicRate}
                                    useHistoricRate
                                />
                            </Text>
                        </Table.Cell>
                        <Table.Cell align="end">
                            <Text intent="neutral">
                                <BaseCurrencyValue amount={cardanoDeposit} symbol={tx.symbol} />
                            </Text>
                        </Table.Cell>
                    </Table.Row>
                )}
                {/* TX FEE */}
                {isTxFeePaid(tx) && (
                    <Table.Row>
                        <Table.Cell>
                            <Text intent="neutral" priority="secondary">
                                <Translation id="TR_TX_FEE" />
                            </Text>
                        </Table.Cell>
                        <Table.Cell align="end">
                            <Text intent="neutral">
                                <FormattedCryptoAmount
                                    value={fee}
                                    symbol={tx.symbol}
                                    signValue={new BigNumber(fee).isZero() ? undefined : 'negative'}
                                />
                            </Text>
                        </Table.Cell>
                        <Table.Cell align="end">
                            <Text intent="neutral">
                                <BaseCurrencyValue
                                    amount={fee}
                                    symbol={tx.symbol}
                                    historicRate={historicRate}
                                    useHistoricRate
                                />
                            </Text>
                        </Table.Cell>
                        <Table.Cell align="end">
                            <Text intent="neutral">
                                <BaseCurrencyValue amount={fee} symbol={tx.symbol} />
                            </Text>
                        </Table.Cell>
                    </Table.Row>
                )}
            </Table.Body>
        </Table>
    );
};
