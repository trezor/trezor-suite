import { useSelector } from 'react-redux';

import { AlertBox, Box, Card, Text, VStack } from '@suite-native/atoms';
import { AccountKey, Timestamp } from '@suite-common/wallet-types';
import { useFormatters } from '@suite-common/formatters';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import {
    TransactionsRootState,
    selectIsPhishingTransaction,
    FiatRatesRootState,
    selectHistoricFiatRatesByTimestamp,
    selectTransactionBlockTimeById,
} from '@suite-common/wallet-core';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { TypedTokenTransfer, WalletAccountTransaction } from '@suite-native/tokens';
import { Translation, useTranslate } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { selectFiatCurrencyCode } from '@suite-native/settings';
import { useNativeStyles } from '@trezor/styles';

import { cardStyle, TransactionDetailSummary } from './TransactionDetailSummary';
import { TransactionDetailRow } from './TransactionDetailRow';
import { TransactionDetailIncludedCoins } from './TransactionDetailIncludedCoins';
import { TransactionDetailSheets } from './TransactionDetailSheets';

type TransactionDetailDataProps = {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
    tokenTransfer?: TypedTokenTransfer;
};

export const TransactionDetailData = ({
    transaction,
    accountKey,
    tokenTransfer,
}: TransactionDetailDataProps) => {
    const { DateFormatter, TimeFormatter } = useFormatters();
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();

    const transactionBlockTime = useSelector((state: TransactionsRootState) =>
        selectTransactionBlockTimeById(state, transaction.txid, accountKey),
    );
    const isPhishingTransaction = useSelector(
        (state: TokenDefinitionsRootState & TransactionsRootState) =>
            selectIsPhishingTransaction(state, transaction.txid, accountKey),
    );

    const fiatCurrencyCode = useSelector(selectFiatCurrencyCode);
    const fiatRateKey = getFiatRateKey(transaction.symbol, fiatCurrencyCode);
    const historicRate = useSelector((state: FiatRatesRootState) =>
        selectHistoricFiatRatesByTimestamp(state, fiatRateKey, transaction.blockTime as Timestamp),
    );

    const transactionTokensCount = transaction.tokens.length;

    const isTokenTransaction = !!tokenTransfer;
    const isMultiTokenTransaction = isTokenTransaction && transactionTokensCount - 1 > 0;
    const isNetworkTransactionWithTokens = !isTokenTransaction && transactionTokensCount > 0;

    const hasIncludedCoins = isMultiTokenTransaction || isNetworkTransactionWithTokens;

    return (
        <VStack spacing="sp16">
            {isPhishingTransaction && (
                <AlertBox
                    variant="error"
                    title={
                        <Translation
                            id="transactions.phishing.warning"
                            values={{
                                blogLink: chunks => (
                                    <Link
                                        href="https://trezor.io/support/a/address-poisoning-attacks"
                                        label={chunks}
                                        textColor="textDefault"
                                        isUnderlined
                                    />
                                ),
                            }}
                        />
                    }
                />
            )}
            <Card borderColor="borderElevation1" style={applyStyle(cardStyle)}>
                <VStack spacing="sp24">
                    <TransactionDetailRow title={translate('transactions.detail.feeLabel')}>
                        <Box alignItems="flex-end">
                            <CryptoAmountFormatter
                                value={transaction.fee}
                                network={transaction.symbol}
                                variant="hint"
                                color="textDefault"
                                isBalance={false}
                            />
                            {historicRate !== undefined && historicRate !== 0 && (
                                <Box flexDirection="row">
                                    <CryptoToFiatAmountFormatter
                                        value={transaction.fee}
                                        network={transaction.symbol}
                                        historicRate={historicRate}
                                        useHistoricRate
                                        variant="hint"
                                        color="textSubdued"
                                    />
                                </Box>
                            )}
                        </Box>
                    </TransactionDetailRow>
                    {transactionBlockTime && (
                        <>
                            <TransactionDetailRow
                                title={translate('transactions.detail.dateLabel')}
                            >
                                <Box alignItems="flex-end">
                                    <Text variant="hint">
                                        <DateFormatter value={transactionBlockTime} />
                                    </Text>
                                    <Text variant="hint" color="textSubdued">
                                        <TimeFormatter value={transactionBlockTime} />
                                    </Text>
                                </Box>
                            </TransactionDetailRow>
                        </>
                    )}
                </VStack>
            </Card>
            <TransactionDetailSummary
                txid={transaction.txid}
                accountKey={accountKey}
                tokenTransfer={tokenTransfer}
            />
            {hasIncludedCoins && (
                <TransactionDetailIncludedCoins
                    accountKey={accountKey}
                    transaction={transaction}
                    tokenTransfer={tokenTransfer}
                />
            )}

            <TransactionDetailSheets
                transaction={transaction}
                isTokenTransaction={isTokenTransaction}
                accountKey={accountKey}
            />
        </VStack>
    );
};
