import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { getExplorerUrl, getNetwork } from '@suite-common/wallet-config';
import {
    type ExplorerState,
    type YieldPendingTransactionState,
    selectExplorer,
} from '@suite-common/wallet-core';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { CryptoIcon, NetworkIcon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type EarnPendingTransactionRow } from '../components/EarnPendingTransactionModal';

type UseYieldApprovalPendingModalDataParams = {
    account: Account;
    pendingTransaction?: YieldPendingTransactionState;
    tokenContract: TokenAddress;
    tokenSymbol: string;
    vaultName: string;
};

const VAULT_NAME_MAX_WIDTH = 150;

const constrainedValueStyle = prepareNativeStyle(() => ({
    maxWidth: VAULT_NAME_MAX_WIDTH,
    minWidth: 0,
    flexShrink: 1,
}));

const constrainedValueTextStyle = prepareNativeStyle(() => ({
    minWidth: 0,
    flexShrink: 1,
}));

export const useYieldApprovalPendingModalData = ({
    account,
    pendingTransaction,
    tokenContract,
    tokenSymbol,
    vaultName,
}: UseYieldApprovalPendingModalDataParams) => {
    const { applyStyle } = useNativeStyles();
    const { TimeFormatter } = useFormatters();
    const { translate } = useTranslate();
    const openLink = useOpenLink();
    const blockchainExplorer = useSelector((state: ExplorerState) =>
        selectExplorer(state, account.symbol),
    );
    const explorerUrl = getExplorerUrl(blockchainExplorer, 'tx');

    if (!pendingTransaction) {
        return undefined;
    }

    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;
    const approvalLimitValue =
        pendingTransaction.approvalLimitType === 'unlimited'
            ? translate('earn.yieldSupplyFlowScreen.approvalLimitSheet.unlimited.title')
            : `${pendingTransaction.amount} ${tokenSymbol}`;
    const submittedTime = TimeFormatter.format(new Date(pendingTransaction.createdTimestamp));
    const pendingTransactionFee = pendingTransaction.fee ?? null;

    const rows: EarnPendingTransactionRow[] = [
        {
            label: <Translation id="earn.pendingTransactionModal.date" />,
            value: (
                <Text variant="body-sm" textAlign="right">
                    <Translation
                        id="earn.pendingTransactionModal.todayAt"
                        values={{ time: submittedTime }}
                    />
                </Text>
            ),
        },
        {
            label: <Translation id="earn.pendingTransactionModal.account" />,
            value: (
                <HStack alignItems="center" spacing="sp8">
                    <NetworkIcon symbol={account.symbol} size={20} />
                    <Text variant="body-sm" numberOfLines={1} ellipsizeMode="tail">
                        {accountLabel}
                    </Text>
                </HStack>
            ),
        },
        {
            label: <Translation id="earn.pendingTransactionModal.vault" />,
            value: (
                <HStack alignItems="center" spacing="sp4" style={applyStyle(constrainedValueStyle)}>
                    <CryptoIcon symbol={account.symbol} contractAddress={tokenContract} size={20} />
                    <Text
                        variant="body-sm"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={applyStyle(constrainedValueTextStyle)}
                    >
                        {vaultName}
                    </Text>
                </HStack>
            ),
        },
        {
            label: <Translation id="earn.pendingTransactionModal.approvalLimit" />,
            value: (
                <HStack alignItems="center" spacing="sp4">
                    <CryptoIcon symbol={account.symbol} contractAddress={tokenContract} size={20} />
                    <Text variant="body-sm" numberOfLines={1} ellipsizeMode="tail">
                        {approvalLimitValue}
                    </Text>
                </HStack>
            ),
        },
    ];

    if (pendingTransactionFee !== null) {
        rows.push({
            label: <Translation id="earn.pendingTransactionModal.maximumFee" />,
            value: (
                <VStack alignItems="flex-end" spacing="sp2">
                    <CryptoAmountFormatter
                        value={pendingTransactionFee}
                        symbol={account.symbol}
                        variant="body-sm"
                        color="contentPrimary"
                        isBalance={false}
                        isDiscreetText={false}
                    />
                    <CryptoToFiatAmountFormatter
                        value={pendingTransactionFee}
                        symbol={account.symbol}
                        variant="body-sm"
                        color="contentSecondary"
                        isDiscreetText={false}
                    />
                </VStack>
            ),
        });
    }

    const explorerTransactionUrl = explorerUrl
        ? `${explorerUrl}${pendingTransaction.txid}${blockchainExplorer?.queryString ?? ''}`
        : undefined;

    return {
        handleExploreInBlockchain: explorerTransactionUrl
            ? () => openLink(explorerTransactionUrl)
            : undefined,
        pendingTransaction,
        rows,
    };
};
