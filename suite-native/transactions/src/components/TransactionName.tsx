import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { Translation, TxKeyPath } from '@suite-native/intl';

type TransactionNameProps = {
    transaction: WalletAccountTransaction;
    isPending: boolean;
};

interface GetSelfTransactionMessageByTypeProps {
    type?: Required<WalletAccountTransaction>['cardanoSpecific']['subtype'];
}

const getSelfTransactionMessageByType = ({
    type,
}: GetSelfTransactionMessageByTypeProps): TxKeyPath => {
    switch (type) {
        case 'withdrawal':
            return 'transactions.name.withdrawal';
        case 'stake_delegation':
            return 'transactions.name.stakeDelegation';
        case 'stake_registration':
            return 'transactions.name.stakeRegistration';
        case 'stake_deregistration':
            return 'transactions.name.stakeDeregistration';
        default:
            return 'transactions.name.self';
    }
};

export const getTransactionName = (
    transaction: WalletAccountTransaction,
    isPending: boolean,
): TxKeyPath => {
    switch (transaction.type) {
        case 'sent':
            return isPending ? 'transactions.name.sending' : 'transactions.name.sent';
        case 'recv':
            return isPending ? 'transactions.name.receiving' : 'transactions.name.received';
        case 'failed':
            return 'transactions.name.failed';
        case 'joint':
            return 'transactions.name.joint';
        case 'contract':
            return 'transactions.name.contract';
        case 'self':
            return getSelfTransactionMessageByType({
                type: transaction.cardanoSpecific?.subtype,
            });

        default:
            return isPending ? 'transactions.name.pending' : 'transactions.name.unknown';
    }
};

export const TransactionName = ({ transaction, isPending }: TransactionNameProps) => {
    const ethName = transaction.ethereumSpecific?.parsedData?.name;

    // use name of eth txns, but not for recv or sent Transfer
    if (
        ethName &&
        ethName !== 'Transfer' &&
        transaction.type !== 'recv' &&
        transaction.type !== 'sent'
    ) {
        return ethName;
    }

    return <Translation id={getTransactionName(transaction, isPending)} />;
};
