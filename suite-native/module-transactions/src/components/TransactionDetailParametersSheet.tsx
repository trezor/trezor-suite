import { useSelector } from 'react-redux';

import { type NetworkType, networks } from '@suite-common/wallet-config';
import {
    type BlockchainRootState,
    type TransactionsRootState,
    selectTransactionConfirmations,
} from '@suite-common/wallet-core';
import { type AccountKey, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { Box, Card, IconButton, Text, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { FeeFormatter, TransactionIdFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';

import { TransactionDetailRow } from './TransactionDetailRow';
import { TransactionDetailSheet } from './TransactionDetailSheet';

type TransactionDetailParametersSheetProps = {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
};

type EthereumParametersProps = {
    transaction: WalletAccountTransaction;
};

type TransactionParameter =
    | keyof Pick<NonNullable<WalletAccountTransaction>, 'feeRate' | 'lockTime' | 'ethereumSpecific'>
    | 'broadcast';

const networkTypeToDisplayedParametersMap: Record<NetworkType, TransactionParameter[]> = {
    bitcoin: ['feeRate', 'broadcast', 'lockTime'],
    ethereum: ['ethereumSpecific', 'broadcast'],
    ripple: ['broadcast'],
    cardano: [],
    solana: [],
    stellar: [],
    tron: [],
};

const getEnabledTitleTranslationId = (enabled: boolean) =>
    enabled
        ? 'transactions.TransactionDetailScreen.parametersSheet.values.enabled'
        : 'transactions.TransactionDetailScreen.parametersSheet.values.disabled';

const EthereumParameters = ({ transaction }: EthereumParametersProps) => {
    const { translate } = useTranslate();
    if (!transaction.ethereumSpecific) return null;

    const { gasLimit, gasUsed, nonce } = transaction.ethereumSpecific;

    return (
        <>
            <TransactionDetailRow
                title={translate(
                    'transactions.TransactionDetailScreen.parametersSheet.ethereum.gasLimit',
                )}
            >
                {gasLimit}
            </TransactionDetailRow>
            <TransactionDetailRow
                title={translate(
                    'transactions.TransactionDetailScreen.parametersSheet.ethereum.gasUsed',
                )}
            >
                {gasUsed}
            </TransactionDetailRow>
            <TransactionDetailRow
                title={translate(
                    'transactions.TransactionDetailScreen.parametersSheet.ethereum.gasPrice',
                )}
            >
                <FeeFormatter transaction={transaction} />
            </TransactionDetailRow>
            <TransactionDetailRow
                title={translate(
                    'transactions.TransactionDetailScreen.parametersSheet.ethereum.nonce',
                )}
            >
                {nonce}
            </TransactionDetailRow>
        </>
    );
};

const ConfirmationsCount = ({ txid, accountKey }: { txid: string; accountKey: AccountKey }) => {
    const confirmationsCount = useSelector((state: TransactionsRootState & BlockchainRootState) =>
        selectTransactionConfirmations(state, txid, accountKey),
    );

    return <>{confirmationsCount}</>;
};

export const TransactionDetailParametersSheet = ({
    transaction,
    accountKey,
}: TransactionDetailParametersSheetProps) => {
    const copyToClipboard = useCopyToClipboard();
    const { translate } = useTranslate();

    const { networkType } = networks[transaction.symbol];
    const displayedParameters = networkTypeToDisplayedParametersMap[networkType];
    const parametersCardIsDisplayed = displayedParameters.length !== 0;

    const handleClickCopy = () =>
        copyToClipboard(
            transaction.txid,
            translate('transactions.TransactionDetailScreen.parametersSheet.transactionIdCopied'),
        );

    return (
        <TransactionDetailSheet
            sheetName="parameters"
            title={translate('transactions.detail.sheet.parameters')}
            iconName="info"
            transactionId={transaction.txid}
        >
            <VStack>
                <Card>
                    <TransactionDetailRow
                        title={translate(
                            'transactions.TransactionDetailScreen.parametersSheet.transactionId',
                        )}
                    >
                        <Box
                            flexDirection="row"
                            alignItems="center"
                            paddingLeft="sp16"
                            justifyContent="flex-end"
                        >
                            <Text numberOfLines={1} style={{ flexShrink: 1 }}>
                                <TransactionIdFormatter value={transaction.txid} />
                            </Text>
                            <Box marginLeft="sp8">
                                <IconButton
                                    iconName="copy"
                                    onPress={handleClickCopy}
                                    intent="neutral"
                                    priority="secondary"
                                />
                            </Box>
                        </Box>
                    </TransactionDetailRow>
                    <TransactionDetailRow
                        title={translate(
                            'transactions.TransactionDetailScreen.parametersSheet.confirmations',
                        )}
                    >
                        <Text>
                            <ConfirmationsCount txid={transaction.txid} accountKey={accountKey} />
                        </Text>
                        <Box marginLeft="sp8">
                            <Icon name="checks" />
                        </Box>
                    </TransactionDetailRow>
                </Card>

                {parametersCardIsDisplayed && (
                    <Card>
                        {displayedParameters.includes('ethereumSpecific') &&
                            transaction.ethereumSpecific && (
                                <EthereumParameters transaction={transaction} />
                            )}
                        {displayedParameters.includes('feeRate') && (
                            <TransactionDetailRow
                                title={translate(
                                    'transactions.TransactionDetailScreen.parametersSheet.feeRate',
                                )}
                            >
                                <FeeFormatter transaction={transaction} />
                            </TransactionDetailRow>
                        )}
                        {transaction.symbol === 'btc' && (
                            <TransactionDetailRow
                                title={translate(
                                    'transactions.TransactionDetailScreen.parametersSheet.rbf',
                                )}
                            >
                                {translate(getEnabledTitleTranslationId(!!transaction.rbf))}
                            </TransactionDetailRow>
                        )}
                        {displayedParameters.includes('broadcast') && (
                            <TransactionDetailRow
                                title={translate(
                                    'transactions.TransactionDetailScreen.parametersSheet.broadcast',
                                )}
                            >
                                {translate(getEnabledTitleTranslationId(!!transaction.blockHeight))}
                            </TransactionDetailRow>
                        )}
                        {displayedParameters.includes('lockTime') && (
                            <TransactionDetailRow
                                title={translate(
                                    'transactions.TransactionDetailScreen.parametersSheet.lockTime',
                                )}
                            >
                                {translate(getEnabledTitleTranslationId(!!transaction.lockTime))}
                            </TransactionDetailRow>
                        )}
                    </Card>
                )}
            </VStack>
        </TransactionDetailSheet>
    );
};
