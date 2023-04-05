import React from 'react';
import { useSelector } from 'react-redux';

import { fromWei } from 'web3-utils';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { Box, Card, IconButton, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@trezor/icons';
import { getConfirmations, getFeeRate, getFeeUnits } from '@suite-common/wallet-utils';
import { BlockchainRootState, selectBlockchainHeightBySymbol } from '@suite-common/wallet-core';
import { useCopyToClipboard } from '@suite-native/helpers';
import { TransactionIdFormatter } from '@suite-native/formatters';
import { networks, NetworkType } from '@suite-common/wallet-config';

import { TransactionDetailSheet } from './TransactionDetailSheet';
import { TransactionDetailRow } from './TransactionDetailRow';

type TransactionDetailParametersSheetProps = {
    isVisible: boolean;
    transaction: WalletAccountTransaction;
    onSheetVisibilityChange: () => void;
};

type EthereumParametersProps = Pick<
    NonNullable<WalletAccountTransaction['ethereumSpecific']>,
    'gasLimit' | 'gasUsed' | 'gasPrice' | 'nonce'
>;

const transactionIdStyle = prepareNativeStyle(_ => ({
    maxWidth: '72%',
}));

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
            {`${fromWei(gasPrice ?? '0', 'gwei')} ${getFeeUnits('ethereum')}`}
        </TransactionDetailRow>
        <TransactionDetailRow title="Nonce">{nonce}</TransactionDetailRow>
    </>
);

export const TransactionDetailParametersSheet = ({
    isVisible,
    onSheetVisibilityChange,
    transaction,
}: TransactionDetailParametersSheetProps) => {
    const copyToClipboard = useCopyToClipboard();
    const { applyStyle } = useNativeStyles();
    const blockchainHeight = useSelector((state: BlockchainRootState) =>
        selectBlockchainHeightBySymbol(state, transaction.symbol),
    );

    const { networkType } = networks[transaction.symbol];
    const displayedParameters = networkTypeToDisplayedParametersMap[networkType];
    const parametersCardIsDisplayed = displayedParameters.length !== 0;
    const confirmationsCount = getConfirmations(transaction, blockchainHeight);

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
                            style={applyStyle(transactionIdStyle)}
                        >
                            <TransactionIdFormatter value={transaction.txid} />
                            <Box marginLeft="medium">
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
                        <Text>{confirmationsCount} </Text>
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
