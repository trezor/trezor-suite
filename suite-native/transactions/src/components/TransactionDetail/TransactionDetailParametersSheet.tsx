import { useSelector } from 'react-redux';

import { NetworkType, networks } from '@suite-common/wallet-config';
import {
    BlockchainRootState,
    TransactionsRootState,
    selectTransactionConfirmations,
} from '@suite-common/wallet-core';
import { AccountKey, WalletAccountTransaction } from '@suite-common/wallet-types';
import { Box, Card, IconButton, Text, VStack } from '@suite-native/atoms';
import { FeeFormatter, TransactionIdFormatter } from '@suite-native/formatters';
import { useCopyToClipboard } from '@suite-native/helpers';
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
};

const getEnabledTitle = (enabled: boolean) => (enabled ? 'Enabled' : 'Disabled');

const EthereumParameters = ({ transaction }: EthereumParametersProps) => {
    if (!transaction.ethereumSpecific) return null;

    const { gasLimit, gasUsed, nonce } = transaction.ethereumSpecific;

    return (
        <>
            <TransactionDetailRow title="Gas limit">{gasLimit}</TransactionDetailRow>
            <TransactionDetailRow title="Gas used">{gasUsed}</TransactionDetailRow>
            <TransactionDetailRow title="Gas price">
                <FeeFormatter transaction={transaction} />
            </TransactionDetailRow>
            <TransactionDetailRow title="Nonce">{nonce}</TransactionDetailRow>
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

    const handleClickCopy = () => copyToClipboard(transaction.txid, 'Transaction ID copied');

    return (
        <TransactionDetailSheet
            sheetName="parameters"
            title={translate('transactions.detail.sheet.parameters')}
            iconName="info"
            transactionId={transaction.txid}
        >
            <VStack>
                <Card>
                    <TransactionDetailRow title="Transaction ID">
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
                                    colorScheme="tertiaryElevation1"
                                    size="medium"
                                />
                            </Box>
                        </Box>
                    </TransactionDetailRow>
                    <TransactionDetailRow title="Confirmations">
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
                            <TransactionDetailRow title="Fee rate">
                                <FeeFormatter transaction={transaction} />
                            </TransactionDetailRow>
                        )}
                        {transaction.symbol === 'btc' && (
                            <TransactionDetailRow title="RBF">
                                {getEnabledTitle(!!transaction.rbf)}
                            </TransactionDetailRow>
                        )}
                        {displayedParameters.includes('broadcast') && (
                            <TransactionDetailRow title="Broadcast">
                                {getEnabledTitle(!!transaction.blockHeight)}
                            </TransactionDetailRow>
                        )}
                        {displayedParameters.includes('lockTime') && (
                            <TransactionDetailRow title="Locktime">
                                {getEnabledTitle(!!transaction.lockTime)}
                            </TransactionDetailRow>
                        )}
                    </Card>
                )}
            </VStack>
        </TransactionDetailSheet>
    );
};
