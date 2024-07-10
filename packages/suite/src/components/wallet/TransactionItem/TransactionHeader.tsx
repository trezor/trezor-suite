import { Translation } from 'src/components/suite';
import { getTxHeaderSymbol } from '@suite-common/wallet-utils';
import { WalletAccountTransaction } from 'src/types/wallet';
import { AccountTransaction } from '@trezor/connect';
import { UnstakingTxAmount } from 'src/components/suite/UnstakingTxAmount';
import { isSupportedEthStakingNetworkSymbol } from '@suite-common/wallet-core';

interface TransactionHeaderProps {
    transaction: WalletAccountTransaction;
    isPending: boolean;
}

interface GetSelfTransactionMessageByTypeProps {
    type?: Required<AccountTransaction>['cardanoSpecific']['subtype'];
    isPending: TransactionHeaderProps['isPending'];
}

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

export const TransactionHeader = ({ transaction, isPending }: TransactionHeaderProps) => {
    if (transaction?.ethereumSpecific?.parsedData?.name) {
        return (
            <>
                <span>{transaction.ethereumSpecific.parsedData.name}</span>
                {isSupportedEthStakingNetworkSymbol(transaction.symbol) && (
                    <UnstakingTxAmount transaction={transaction} />
                )}
            </>
        );
    }

    const isMultiTokenTransaction = transaction.tokens.length > 1;
    const symbol = getTxHeaderSymbol(transaction)?.toUpperCase();

    return (
        <Translation
            id={getTransactionMessageId({ transaction, isPending })}
            values={{ symbol, multiple: isMultiTokenTransaction }}
        />
    );
};
