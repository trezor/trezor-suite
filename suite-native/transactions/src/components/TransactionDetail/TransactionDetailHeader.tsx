import { Badge, Box, DiscreetTextTrigger, Text, VStack } from '@suite-native/atoms';
import { isPending } from '@suite-common/wallet-utils';
import { AccountKey } from '@suite-common/wallet-types';
import {
    CryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
    TokenAmountFormatter,
    TokenToFiatAmountFormatter,
    SignValueFormatter,
} from '@suite-native/formatters';
import { TypedTokenTransfer, WalletAccountTransaction } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';

import { useTransactionFiatRate } from '../../hooks/useTransactionFiatRate';
import { TransactionIcon } from '../TransactionsList/TransactionIcon';
import { getTransactionValueSign } from '../../utils';

type TransactionDetailHeaderProps = {
    transaction: WalletAccountTransaction;
    tokenTransfer?: TypedTokenTransfer;
    accountKey: AccountKey;
};

const ICON_SIZE = 56;
const ICON_SPINNER_WIDTH = 3;

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
    accountKey,
}: TransactionDetailHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    const historicRate = useTransactionFiatRate({
        accountKey,
        transaction,
        tokenAddress: tokenTransfer?.contract,
    });

    const { type } = transaction;

    const isPendingTx = isPending(transaction);
    const isFailedTx = transaction.type === 'failed';
    const signValue = getTransactionValueSign(tokenTransfer?.type ?? transaction.type);
    const isTokenOnlyTransaction = transaction.amount === '0' && transaction.tokens.length !== 0;
    const txType = isTokenOnlyTransaction ? transaction.tokens[0].type : type;

    return (
        <DiscreetTextTrigger>
            <Box alignItems="center">
                <VStack spacing="sp16" alignItems="center" justifyContent="center">
                    <TransactionIcon
                        transactionType={txType}
                        isAnimated={isPendingTx}
                        containerSize={ICON_SIZE}
                        iconSize="extraLarge"
                        spinnerWidth={ICON_SPINNER_WIDTH}
                        iconColor="iconDefault"
                        spinnerColor="backgroundAlertYellowBold"
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
                                variant="titleMedium"
                            />
                        )}
                        <Text> </Text>

                        {tokenTransfer ? (
                            <TokenAmountFormatter
                                value={tokenTransfer.amount}
                                symbol={tokenTransfer.symbol}
                                decimals={tokenTransfer.decimals}
                                variant="titleMedium"
                                color="textDefault"
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                style={applyStyle(failedTxStyle, { isFailedTx })}
                            />
                        ) : (
                            <CryptoAmountFormatter
                                value={transaction.amount}
                                network={transaction.symbol}
                                isBalance={false}
                                variant="titleMedium"
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
                                networkSymbol={transaction.symbol}
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
                                network={transaction.symbol}
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
