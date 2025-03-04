import { getNetworkDisplaySymbol, isNetworkSymbol } from '@suite-common/wallet-config';
import { StakeType } from '@suite-common/wallet-types';
import {
    getTxHeaderSymbol,
    isSupportedEthStakingNetworkSymbol,
    isSupportedSolStakingNetworkSymbol,
} from '@suite-common/wallet-utils';
import { Row } from '@trezor/components';
import { AccountTransaction } from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { UnstakingTxAmount } from 'src/components/suite/UnstakingTxAmount';
import { useTranslation } from 'src/hooks/suite';
import { WalletAccountTransaction } from 'src/types/wallet';
import { BlurUrls } from 'src/views/wallet/tokens/common/BlurUrls';

type TransactionHeaderProps = {
    transaction: WalletAccountTransaction;
    isPending: boolean;
};

type GetSelfTransactionMessageByTypeProps = {
    type?: Required<AccountTransaction>['cardanoSpecific']['subtype'];
    isPending: TransactionHeaderProps['isPending'];
};

const getSelfTransactionMessageByType = ({
    type,
    isPending,
}: GetSelfTransactionMessageByTypeProps) => {
    switch (type) {
        case 'withdrawal':
            return 'TR_REWARDS_WITHDRAWAL';
        case 'stake_delegation':
            return 'TR_STAKE_DELEGATED';
        case 'stake_registration':
            return 'TR_STAKE_REGISTERED';
        case 'stake_deregistration':
            return 'TR_STAKE_DEREGISTERED';
        default:
            return isPending ? 'TR_SENDING_SYMBOL_TO_SELF' : 'TR_SENT_SYMBOL_TO_SELF';
    }
};

interface GetTransactionMessageIdProps {
    transaction: WalletAccountTransaction;
    isPending: boolean;
}

const getTransactionMessageId = ({ transaction, isPending }: GetTransactionMessageIdProps) => {
    switch (transaction.type) {
        case 'sent':
            return isPending ? 'TR_SENDING_SYMBOL' : 'TR_SENT_SYMBOL';
        case 'recv':
            return isPending ? 'TR_RECEIVING_SYMBOL' : 'TR_RECEIVED_SYMBOL';
        case 'failed':
            return 'TR_FAILED_TRANSACTION';
        case 'joint':
            return 'TR_JOINT_TRANSACTION';
        case 'contract':
            return 'TR_CONTRACT_TRANSACTION';
        case 'self':
            return getSelfTransactionMessageByType({
                type: transaction.cardanoSpecific?.subtype,
                isPending,
            });
        case 'unknown':
        default:
            return 'TR_UNKNOWN_TRANSACTION';
    }
};

const getSolTransactionStakeTypeName = (stakeType: StakeType) => {
    switch (stakeType) {
        case 'stake':
            return 'Stake';
        case 'unstake':
            return 'Unstake';
        case 'claim':
            return 'Claim Withdraw Request';
    }
};

export const TransactionHeader = ({ transaction, isPending }: TransactionHeaderProps) => {
    const { translationString } = useTranslation();

    if (
        transaction?.ethereumSpecific?.parsedData?.name &&
        transaction.type !== 'failed' &&
        // Exclude Transfer txs, the default messages are more descriptive
        transaction.ethereumSpecific.parsedData.name !== 'Transfer'
    ) {
        return (
            <Row gap={spacings.xxs} overflow="hidden">
                <span>{transaction.ethereumSpecific.parsedData.name}</span>
                {isSupportedEthStakingNetworkSymbol(transaction.symbol) && (
                    <UnstakingTxAmount transaction={transaction} />
                )}
            </Row>
        );
    }
    const solanaStakeType = transaction?.solanaSpecific?.stakeOperation?.type;
    if (solanaStakeType) {
        return (
            <Row gap={spacings.xxs} overflow="hidden">
                <span>{getSolTransactionStakeTypeName(solanaStakeType)}</span>
                {isSupportedSolStakingNetworkSymbol(transaction.symbol) && (
                    <UnstakingTxAmount transaction={transaction} />
                )}
            </Row>
        );
    }

    // Swap transaction - 2 tokens, token to native or native to token
    if (
        transaction.tokens.length === 2 ||
        (transaction.tokens.length === 1 &&
            (transaction.internalTransfers.length === 1 || transaction.targets.length === 1))
    ) {
        const combined = [
            ...transaction.tokens,
            ...transaction.internalTransfers.map(t => ({
                type: t.type,
                symbol: getNetworkDisplaySymbol(transaction.symbol),
            })),
            ...transaction.targets.map(_ => ({
                type: 'sent',
                symbol: getNetworkDisplaySymbol(transaction.symbol),
            })),
        ];
        const fromSymbol = combined.find(t => t.type === 'sent')?.symbol;
        const toSymbol = combined.find(t => t.type === 'recv')?.symbol;

        if (fromSymbol && toSymbol) {
            return (
                <BlurUrls
                    text={translationString('TR_SWAP_TRANSACTION', { fromSymbol, toSymbol })}
                />
            );
        }
    }

    const isMultiTokenTransaction = transaction.tokens.length > 1;
    const transactionSymbol = getTxHeaderSymbol(transaction);
    const symbol =
        transactionSymbol && isNetworkSymbol(transactionSymbol)
            ? getNetworkDisplaySymbol(transactionSymbol)
            : transactionSymbol?.toUpperCase();

    return (
        <BlurUrls
            text={translationString(getTransactionMessageId({ transaction, isPending }), {
                symbol,
                multiple: isMultiTokenTransaction,
            })}
        />
    );
};
