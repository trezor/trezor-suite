import { Translation } from 'src/components/suite';
import { getTxHeaderSymbol } from '@suite-common/wallet-utils';
import { WalletAccountTransaction } from 'src/types/wallet';
import { AccountTransaction } from '@trezor/connect';

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

export const TransactionHeader = ({ transaction, isPending }: TransactionHeaderProps) => {
    // Use ETH method name if available
    if (transaction?.ethereumSpecific?.parsedData?.name) {
        return <span>{transaction.ethereumSpecific.parsedData.name}</span>;
    }

    const isMultiTokenTransaction = transaction.tokens.length > 1;
    const symbol = getTxHeaderSymbol(transaction)?.toUpperCase();

    switch (transaction.type) {
        case 'sent':
            return (
                <Translation
                    id={isPending ? 'TR_SENDING_SYMBOL' : 'TR_SENT_SYMBOL'}
                    values={{ symbol, multiple: isMultiTokenTransaction }}
                />
            );

        case 'recv':
            return (
                <Translation
                    id={isPending ? 'TR_RECEIVING_SYMBOL' : 'TR_RECEIVED_SYMBOL'}
                    values={{ symbol, multiple: isMultiTokenTransaction }}
                />
            );
        case 'failed':
            return <Translation id="TR_FAILED_TRANSACTION" />;
        case 'joint':
            return <Translation id="TR_JOINT_TRANSACTION" values={{ symbol }} />;
        case 'contract':
            return <Translation id="TR_CONTRACT_TRANSACTION" />;
        case 'self':
            return (
                <Translation
                    id={getSelfTransactionMessageByType({
                        type: transaction.cardanoSpecific?.subtype,
                        isPending,
                    })}
                    values={{ symbol, multiple: isMultiTokenTransaction }}
                />
            );
        case 'unknown':
        default:
            return <Translation id="TR_UNKNOWN_TRANSACTION" />;
    }
};
