import React from 'react';
import { useSelector } from 'react-redux';

import { fromWei } from 'web3-utils';

import { AccountKey, WalletAccountTransaction } from '@suite-common/wallet-types';
import { Box, Card, IconButton, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-common/icons';
import { getFeeRate, getFeeUnits } from '@suite-common/wallet-utils';
import { selectTransactionConfirmations, TransactionsRootState } from '@suite-common/wallet-core';
import { useCopyToClipboard } from '@suite-native/helpers';
import { TransactionIdFormatter } from '@suite-native/formatters';
import { networks, NetworkType } from '@suite-common/wallet-config';

import { TransactionDetailSheet } from './TransactionDetailSheet';
import { TransactionDetailRow } from './TransactionDetailRow';

type TransactionDetailParametersSheetProps = {
    isVisible: boolean;
    transaction: WalletAccountTransaction;
    onSheetVisibilityChange: () => void;
    accountKey: AccountKey;
};

type EthereumParametersProps = Pick<
    NonNullable<WalletAccountTransaction['ethereumSpecific']>,
    'gasLimit' | 'gasUsed' | 'gasPrice' | 'nonce'
>;

type TransactionParameter =
    | keyof Pick<NonNullable<WalletAccountTransaction>, 'feeRate' | 'lockTime' | 'ethereumSpecific'>
    | 'broadcast';

const networkTypeToDisplayedParametersMap: Record<NetworkType, TransactionParameter[]> = {
    bitcoin: ['feeRate', 'broadcast', 'lockTime'],
    ethereum: ['ethereumSpecific', 'broadcast'],
    ripple: ['broadcast'],
    cardano: [],
};

const getEnabledTitle = (enabled: boolean) => (enabled ? 'Enabled' : 'Disabled');

const EthereumParameters = ({ gasLimit, gasUsed, gasPrice, nonce }: EthereumParametersProps) => (
    <>
        <TransactionDetailRow title="Gas limit">{gasLimit}</TransactionDetailRow>
        <TransactionDetailRow title="Gas used">{gasUsed}</TransactionDetailRow>
        {/* TODO: The `gasPrice` parameter should be handled inside of a fee formatter. */}
        {/* https://github.com/trezor/trezor-suite/issues/7385 */}
        <TransactionDetailRow title="Gas price">
            {`${fromWei(gasPrice, 'gwei')} ${getFeeUnits('ethereum')}`}
        </TransactionDetailRow>
        <TransactionDetailRow title="Nonce">{nonce}</TransactionDetailRow>
    </>
);

const ConfirmationsCount = ({ txid, accountKey }: { txid: string; accountKey: AccountKey }) => {
    const confirmationsCount = useSelector((state: TransactionsRootState) =>
        selectTransactionConfirmations(state, txid, accountKey),
    );
    return <>{confirmationsCount}</>;
};

export const TransactionDetailParametersSheet = ({
    isVisible,
    onSheetVisibilityChange,
    transaction,
    accountKey,
}: TransactionDetailParametersSheetProps) => {
    const copyToClipboard = useCopyToClipboard();

    const { networkType } = networks[transaction.symbol];
    const displayedParameters = networkTypeToDisplayedParametersMap[networkType];
    const parametersCardIsDisplayed = displayedParameters.length !== 0;

    const handleClickCopy = () => copyToClipboard(transaction.txid, 'Transaction ID copied');

    return (
        <TransactionDetailSheet
            isVisible={isVisible}
            onVisibilityChange={onSheetVisibilityChange}
            title="Parameters"
            iconName="warningCircle"
            transactionId={transaction.txid}
        >
            <VStack>
                <Card>
                    <TransactionDetailRow title="Transaction ID">
                        <Box
                            flexDirection="row"
                            alignItems="center"
                            paddingLeft="medium"
                            justifyContent="flex-end"
                        >
                            <Text numberOfLines={1} style={{ flexShrink: 1 }}>
                                <TransactionIdFormatter value={transaction.txid} />
                            </Text>
                            <Box marginLeft="small">
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
                        <Box marginLeft="small">
                            <Icon name="confirmation" />
                        </Box>
                    </TransactionDetailRow>
                </Card>

                {parametersCardIsDisplayed && (
                    <Card>
                        {displayedParameters.includes('ethereumSpecific') &&
                            transaction.ethereumSpecific && (
                                <EthereumParameters {...transaction.ethereumSpecific} />
                            )}
                        {/* TODO: The `feeRate` parameter should be handled inside of a fee formatter. */}
                        {/* https://github.com/trezor/trezor-suite/issues/7385 */}
                        {displayedParameters.includes('feeRate') && (
                            <TransactionDetailRow title="Fee rate">
                                {`${getFeeRate(transaction)} ${getFeeUnits(networkType)}`}
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
