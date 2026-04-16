import { useSelector } from 'react-redux';

import { type FiatRatesRootState, type WalletSettingsRootState } from '@suite-common/wallet-core';
import { isPending } from '@suite-common/wallet-utils';
import { Badge, Box, DiscreetTextTrigger, Text, VStack } from '@suite-native/atoms';
import {
    CryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
    SignValueFormatter,
    TokenAmountFormatter,
    TokenToFiatAmountFormatter,
} from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { type TypedTokenTransfer, type WalletAccountTransaction } from '@suite-native/tokens';
import {
    TransactionIcon,
    getTransactionValueSign,
    selectTransactionFiatRate,
} from '@suite-native/transactions';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type TransactionDetailHeaderProps = {
    transaction: WalletAccountTransaction;
    tokenTransfer?: TypedTokenTransfer;
};

const failedTxStyle = prepareNativeStyle<{ isFailedTx: boolean }>((_, { isFailedTx }) => ({
    extend: {
        condition: isFailedTx,
        style: {
            textDecorationLine: 'line-through',
        },
    },
}));

const fiatValueStyle = prepareNativeStyle(utils => ({
    marginTop: -utils.spacings.sp4,
}));

export const TransactionDetailHeader = ({
    transaction,
    tokenTransfer,
}: TransactionDetailHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    const historicRate = useSelector((state: WalletSettingsRootState & FiatRatesRootState) =>
        selectTransactionFiatRate(state, transaction, tokenTransfer?.contract),
    );

    const { type } = transaction;

    const isPendingTx = isPending(transaction);
    const isFailedTx = transaction.type === 'failed';
    const signValue = getTransactionValueSign(tokenTransfer?.type ?? transaction.type);
    const isTokenOnlyTransaction = transaction.amount === '0' && transaction.tokens.length !== 0;
    const txType = isTokenOnlyTransaction ? (transaction.tokens[0]?.type ?? type) : type;

    return (
        <DiscreetTextTrigger>
            <Box alignItems="center">
                <VStack spacing="sp16" alignItems="center" justifyContent="center">
                    <TransactionIcon
                        transactionType={txType}
                        isAnimated={isPendingTx}
                        containerSize={56}
                        iconSize="extraLarge"
                        backgroundColor="backgroundSurfaceElevation1"
                    />

                    {isPendingTx ? (
                        <Badge
                            variant="yellow"
                            label={<Translation id="transactions.status.pending" />}
                            elevation="1"
                        />
                    ) : (
                        !isFailedTx && (
                            <Badge
                                variant="green"
                                label={<Translation id="transactions.status.confirmed" />}
                            />
                        )
                    )}

                    <Box flexDirection="row">
                        {!isFailedTx && (
                            <SignValueFormatter
                                color="textDefault"
                                value={signValue}
                                variant="headline-md"
                            />
                        )}
                        <Text> </Text>

                        {tokenTransfer ? (
                            <TokenAmountFormatter
                                value={tokenTransfer.amount}
                                tokenSymbol={tokenTransfer.symbol}
                                decimals={tokenTransfer.decimals}
                                variant="headline-md"
                                color="textDefault"
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                style={applyStyle(failedTxStyle, { isFailedTx })}
                            />
                        ) : (
                            <CryptoAmountFormatter
                                value={transaction.amount}
                                symbol={transaction.symbol}
                                isBalance={false}
                                variant="headline-md"
                                color="textDefault"
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                style={applyStyle(failedTxStyle, { isFailedTx })}
                            />
                        )}
                    </Box>
                </VStack>

                {historicRate !== undefined && historicRate !== 0 && (
                    <Box flexDirection="row" style={applyStyle(fiatValueStyle)}>
                        <Text color="textSubdued">≈ </Text>
                        {tokenTransfer ? (
                            <TokenToFiatAmountFormatter
                                symbol={transaction.symbol}
                                contract={tokenTransfer.contract}
                                value={tokenTransfer.amount}
                                decimals={tokenTransfer.decimals}
                                historicRate={historicRate}
                                color="textSubdued"
                                useHistoricRate
                                style={applyStyle(failedTxStyle, { isFailedTx })}
                            />
                        ) : (
                            <CryptoToFiatAmountFormatter
                                value={transaction.amount}
                                symbol={transaction.symbol}
                                historicRate={historicRate}
                                color="textSubdued"
                                useHistoricRate
                                style={applyStyle(failedTxStyle, { isFailedTx })}
                            />
                        )}
                    </Box>
                )}
            </Box>
        </DiscreetTextTrigger>
    );
};
