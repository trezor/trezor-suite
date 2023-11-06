import { Box, Text, useDiscreetMode } from '@suite-native/atoms';
import { Icon, IconName } from '@suite-common/icons';
import { TransactionType } from '@suite-common/wallet-types';
import {
    CryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
    EthereumTokenAmountFormatter,
    EthereumTokenToFiatAmountFormatter,
    SignValueFormatter,
} from '@suite-native/formatters';
import { EthereumTokenTransfer, WalletAccountTransaction } from '@suite-native/ethereum-tokens';
import { SignValue } from '@suite-common/suite-types';

type TransactionDetailHeaderProps = {
    transaction: WalletAccountTransaction;
    tokenTransfer?: EthereumTokenTransfer;
};

type TransactionTypeInfo = {
    text: string;
    iconName?: IconName;
};

export const signValueMap = {
    recv: 'positive',
    sent: 'negative',
    self: undefined,
    joint: undefined,
    contract: undefined,
    failed: undefined,
    unknown: undefined,
} as const satisfies Record<TransactionType, SignValue | undefined>;

const transactionTypeInfo = {
    recv: {
        text: 'Received',
        iconName: 'receive',
    },
    sent: {
        text: 'Sent',
        iconName: 'send',
    },
    contract: {
        text: 'Contract',
    },
    self: {
        text: 'Self',
    },
    joint: {
        text: 'Joint',
    },
    failed: {
        text: 'Failed',
    },
    unknown: {
        text: 'Unknown',
    },
} as const satisfies Record<TransactionType, TransactionTypeInfo>;

export const TransactionDetailHeader = ({
    transaction,
    tokenTransfer,
}: TransactionDetailHeaderProps) => {
    const { isDiscreetMode } = useDiscreetMode();

    const { type } = transaction;
    const { text } = transactionTypeInfo[type];

    const hasTransactionSign = type === 'sent' || type === 'recv';

    return (
        <Box alignItems="center">
            <Box flexDirection="row" alignItems="center" marginBottom="s">
                <Text variant="hint" color="textSubdued">
                    {text}
                </Text>
                {hasTransactionSign && (
                    <Icon
                        name={transactionTypeInfo[type].iconName}
                        color="iconSubdued"
                        size="medium"
                    />
                )}
            </Box>
            <Text variant="titleMedium" numberOfLines={1} adjustsFontSizeToFit={!isDiscreetMode}>
                <SignValueFormatter
                    value={signValueMap[tokenTransfer ? tokenTransfer.type : transaction.type]}
                    variant="titleMedium"
                />
                {tokenTransfer ? (
                    <EthereumTokenAmountFormatter
                        value={tokenTransfer.amount}
                        symbol={tokenTransfer.symbol}
                        decimals={tokenTransfer.decimals}
                        variant="titleMedium"
                        color="textDefault"
                    />
                ) : (
                    <CryptoAmountFormatter
                        value={transaction.amount}
                        network={transaction.symbol}
                        isBalance={false}
                        variant="titleMedium"
                        color="textDefault"
                    />
                )}
            </Text>
            {transaction.rates && (
                <Box flexDirection="row">
                    <Text>≈ </Text>
                    {tokenTransfer ? (
                        <EthereumTokenToFiatAmountFormatter
                            contract={tokenTransfer.contract}
                            value={tokenTransfer.amount}
                            decimals={tokenTransfer.decimals}
                        />
                    ) : (
                        <CryptoToFiatAmountFormatter
                            value={transaction.amount}
                            network={transaction.symbol}
                            customRates={transaction.rates}
                        />
                    )}
                </Box>
            )}
        </Box>
    );
};
