import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    type FiatRatesRootState,
    type Target,
    type WalletSettingsRootState,
} from '@suite-common/wallet-core';
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
import { BigNumber } from '@trezor/utils';

type TransactionDetailHeaderProps = {
    transaction: WalletAccountTransaction;
    tokenTransfer?: TypedTokenTransfer;
    allOutputs: Target[];
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
    allOutputs,
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
    const firstToken = transaction.tokens[0];
    const txType = isTokenOnlyTransaction && firstToken ? firstToken.type : type;
    const isSolanaUnstakeTx = transaction?.solanaSpecific?.stakeOperation?.type === 'unstake';

    const totalOutputAmount = useMemo(() => {
        let sum = new BigNumber(0);

        for (const target of allOutputs) {
            if (isSolanaUnstakeTx) continue;
            if (target.type === 'target') {
                sum = sum.plus(new BigNumber(transaction.amount));
            } else if (['internal', 'token'].includes(target.type)) {
                sum = sum.plus(new BigNumber(target.payload.amount));
            }
        }

        return sum.toString();
    }, [allOutputs, isSolanaUnstakeTx, transaction.amount]);

    return (
        <DiscreetTextTrigger>
            <Box alignItems="center">
                <VStack spacing="sp16" alignItems="center" justifyContent="center">
                    <TransactionIcon transactionType={txType} isAnimated={isPendingTx} size={48} />

                    {isPendingTx ? (
                        <Badge
                            intent="warning"
                            label={<Translation id="transactions.status.pending" />}
                        />
                    ) : (
                        !isFailedTx && (
                            <Badge
                                intent="brand"
                                label={<Translation id="transactions.status.confirmed" />}
                            />
                        )
                    )}

                    {!isSolanaUnstakeTx && (
                        <Box flexDirection="row">
                            {!isFailedTx && (
                                <SignValueFormatter
                                    color="contentPrimary"
                                    value={signValue}
                                    variant="headline-md"
                                />
                            )}

                            {tokenTransfer ? (
                                <TokenAmountFormatter
                                    value={tokenTransfer.amount}
                                    tokenSymbol={tokenTransfer.symbol}
                                    decimals={tokenTransfer.decimals}
                                    variant="headline-md"
                                    color="contentPrimary"
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    style={applyStyle(failedTxStyle, { isFailedTx })}
                                />
                            ) : (
                                <CryptoAmountFormatter
                                    value={totalOutputAmount}
                                    symbol={transaction.symbol}
                                    isBalance={false}
                                    variant="headline-md"
                                    color="contentPrimary"
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    style={applyStyle(failedTxStyle, { isFailedTx })}
                                />
                            )}
                        </Box>
                    )}
                </VStack>

                {!isSolanaUnstakeTx && historicRate !== undefined && historicRate !== 0 && (
                    <Box flexDirection="row" style={applyStyle(fiatValueStyle)}>
                        <Text color="contentSecondary">≈ </Text>
                        {tokenTransfer ? (
                            <TokenToFiatAmountFormatter
                                symbol={transaction.symbol}
                                contract={tokenTransfer.contract}
                                value={tokenTransfer.amount}
                                decimals={tokenTransfer.decimals}
                                historicRate={historicRate}
                                color="contentSecondary"
                                useHistoricRate
                                style={applyStyle(failedTxStyle, { isFailedTx })}
                            />
                        ) : (
                            <CryptoToFiatAmountFormatter
                                value={totalOutputAmount}
                                symbol={transaction.symbol}
                                historicRate={historicRate}
                                color="contentSecondary"
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
