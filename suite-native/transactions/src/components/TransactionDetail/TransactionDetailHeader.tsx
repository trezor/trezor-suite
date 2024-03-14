import { useSelector } from 'react-redux';

import { Box, DiscreetTextTrigger, Text } from '@suite-native/atoms';
import { Icon, IconName } from '@suite-common/icons';
import { FiatRatesRootState, selectHistoricFiatRatesByTimestamp } from '@suite-common/wallet-core';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { Timestamp, TransactionType } from '@suite-common/wallet-types';
import {
    CryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
    EthereumTokenAmountFormatter,
    EthereumTokenToFiatAmountFormatter,
    SignValueFormatter,
} from '@suite-native/formatters';
import { EthereumTokenTransfer, WalletAccountTransaction } from '@suite-native/ethereum-tokens';
import { SignValue } from '@suite-common/suite-types';
import { selectFiatCurrencyCode } from '@suite-native/settings';

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
    const fiatCurrencyCode = useSelector(selectFiatCurrencyCode);
    const fiatRateKey = getFiatRateKey(
        transaction.symbol,
        fiatCurrencyCode,
        tokenTransfer?.contract,
    );
    const historicRate = useSelector((state: FiatRatesRootState) =>
        selectHistoricFiatRatesByTimestamp(state, fiatRateKey, transaction.blockTime as Timestamp),
    );

    const { type } = transaction;
    const { text } = transactionTypeInfo[type];

    const hasTransactionSign = type === 'sent' || type === 'recv';

    return (
        <DiscreetTextTrigger>
            <Box alignItems="center">
                <Box flexDirection="row" alignItems="center" marginBottom="small">
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
                <Box flexDirection="row" paddingHorizontal="large">
                    <SignValueFormatter
                        value={signValueMap[tokenTransfer ? tokenTransfer.type : transaction.type]}
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
                {historicRate !== undefined && historicRate !== 0 && (
                    <Box flexDirection="row">
                        <Text>≈ </Text>
                        {tokenTransfer ? (
                            <EthereumTokenToFiatAmountFormatter
                                contract={tokenTransfer.contract}
                                value={tokenTransfer.amount}
                                decimals={tokenTransfer.decimals}
                                historicRate={historicRate}
                                useHistoricRate
                            />
                        ) : (
                            <CryptoToFiatAmountFormatter
                                value={transaction.amount}
                                network={transaction.symbol}
                                historicRate={historicRate}
                                useHistoricRate
                            />
                        )}
                    </Box>
                )}
            </Box>
        </DiscreetTextTrigger>
    );
};
