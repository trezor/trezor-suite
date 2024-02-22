import { useSelector } from 'react-redux';

import { AlertBox, Box, Card, Text, VStack } from '@suite-native/atoms';
import { AccountKey } from '@suite-common/wallet-types';
import { Icon } from '@suite-common/icons';
import { useFormatters } from '@suite-common/formatters';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import {
    selectTransactionBlockTimeById,
    TransactionsRootState,
    selectIsPhishingTransaction,
} from '@suite-common/wallet-core';
import { EthereumTokenTransfer, WalletAccountTransaction } from '@suite-native/ethereum-tokens';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { TokenDefinitionsRootState } from '@suite-common/wallet-core';

import { TransactionDetailSummary } from './TransactionDetailSummary';
import { TransactionDetailRow } from './TransactionDetailRow';
import { TransactionDetailIncludedCoins } from './TransactionDetailIncludedCoins';

type TransactionDetailDataProps = {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
    tokenTransfer?: EthereumTokenTransfer;
};

export const TransactionDetailData = ({
    transaction,
    accountKey,
    tokenTransfer,
}: TransactionDetailDataProps) => {
    const { DateTimeFormatter } = useFormatters();

    const transactionBlockTime = useSelector((state: TransactionsRootState) =>
        selectTransactionBlockTimeById(state, transaction.txid, accountKey),
    );

    const isPhishingTransaction = useSelector(
        (state: TokenDefinitionsRootState & TransactionsRootState) =>
            selectIsPhishingTransaction(state, transaction.txid, accountKey),
    );

    const transactionTokensCount = transaction.tokens.length;

    const isTokenTransaction = !!tokenTransfer;
    const isMultiTokenTransaction = isTokenTransaction && transactionTokensCount - 1 > 0;
    const isNetworkTransactionWithTokens = !isTokenTransaction && transactionTokensCount > 0;

    const hasIncludedCoins = isMultiTokenTransaction || isNetworkTransactionWithTokens;

    return (
        <>
            <VStack>
                {isPhishingTransaction && (
                    <AlertBox
                        variant="error"
                        isStandalone
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
                <Card>
                    <TransactionDetailRow title="Date">
                        <Text variant="hint">
                            <DateTimeFormatter value={transactionBlockTime} />
                        </Text>
                        <Box marginLeft="small">
                            <Icon name="calendar" size="medium" />
                        </Box>
                    </TransactionDetailRow>
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
                <Card>
                    <TransactionDetailRow title="Fee">
                        <Box alignItems="flex-end">
                            <CryptoAmountFormatter
                                value={transaction.fee}
                                network={transaction.symbol}
                                isBalance={false}
                                variant="body"
                                color="textDefault"
                            />
                            {transaction.rates && (
                                <Box flexDirection="row">
                                    <Text variant="hint" color="textSubdued">
                                        ≈{' '}
                                    </Text>
                                    <CryptoToFiatAmountFormatter
                                        value={transaction.fee}
                                        network={transaction.symbol}
                                        customRates={transaction.rates}
                                        variant="hint"
                                        color="textSubdued"
                                    />
                                </Box>
                            )}
                        </Box>
                    </TransactionDetailRow>
                </Card>
            </VStack>
        </>
    );
};
