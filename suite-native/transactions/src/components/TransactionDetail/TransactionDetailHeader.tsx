import { Badge, Box, DiscreetTextTrigger, Text, VStack } from '@suite-native/atoms';
import { isPending } from '@suite-common/wallet-utils';
import { AccountKey } from '@suite-common/wallet-types';
import {
    CryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
    EthereumTokenAmountFormatter,
    EthereumTokenToFiatAmountFormatter,
    SignValueFormatter,
} from '@suite-native/formatters';
import { EthereumTokenTransfer, WalletAccountTransaction } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';

import { useTransactionFiatRate } from '../../hooks/useTransactionFiatRate';
import { TransactionIcon } from '../TransactionsList/TransactionIcon';
import { getTransactionValueSign } from '../../utils';

type TransactionDetailHeaderProps = {
    transaction: WalletAccountTransaction;
    tokenTransfer?: EthereumTokenTransfer;
    accountKey: AccountKey;
};

const ICON_SIZE = 56;
const ICON_SPINNER_WIDTH = 3;

const fiatValueStyle = prepareNativeStyle(utils => ({
    marginTop: -utils.spacings.extraSmall,
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
    const signValue = getTransactionValueSign(tokenTransfer?.type ?? transaction.type);

    return (
        <DiscreetTextTrigger>
            <Box alignItems="center">
                <VStack spacing="medium" alignItems="center" justifyContent="center">
                    <TransactionIcon
                        transactionType={type}
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
                        <Badge
                            variant="green"
                            label={<Translation id="transactions.status.confirmed" />}
                        />
                    )}

                    <Box flexDirection="row">
                        <SignValueFormatter
                            color="textDefault"
                            value={signValue}
                            variant="titleMedium"
                        />
                        <Text> </Text>
                        {tokenTransfer ? (
                            <EthereumTokenAmountFormatter
                                value={tokenTransfer.amount}
                                symbol={tokenTransfer.symbol}
                                decimals={tokenTransfer.decimals}
                                variant="titleMedium"
                                color="textDefault"
                                numberOfLines={1}
                                adjustsFontSizeToFit
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
                            />
                        )}
                    </Box>
                </VStack>

                {historicRate !== undefined && historicRate !== 0 && (
                    <Box flexDirection="row" style={applyStyle(fiatValueStyle)}>
                        <Text color="textSubdued">≈ </Text>
                        {tokenTransfer ? (
                            <EthereumTokenToFiatAmountFormatter
                                contract={tokenTransfer.contract}
                                value={tokenTransfer.amount}
                                decimals={tokenTransfer.decimals}
                                historicRate={historicRate}
                                color="textSubdued"
                                useHistoricRate
                            />
                        ) : (
                            <CryptoToFiatAmountFormatter
                                value={transaction.amount}
                                network={transaction.symbol}
                                historicRate={historicRate}
                                color="textSubdued"
                                useHistoricRate
                            />
                        )}
                    </Box>
                )}
            </Box>
        </DiscreetTextTrigger>
    );
};
