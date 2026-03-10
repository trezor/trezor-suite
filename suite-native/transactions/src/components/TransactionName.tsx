import { StakeType, WalletAccountTransaction } from '@suite-common/wallet-types';
import { signatureToStakeTypeMap } from '@suite-common/wallet-utils';
import { Text } from '@suite-native/atoms';
import { Translation, TxKeyPath } from '@suite-native/intl';
import { NativeTypographyStyle } from '@trezor/theme';

type TransactionNameProps = {
    transaction: WalletAccountTransaction;
    isPending: boolean;
    variant?: NativeTypographyStyle;
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

const getStakingOperationType = (transaction: WalletAccountTransaction): StakeType => {
    const ethMethodId = transaction.ethereumSpecific?.parsedData?.methodId;
    const ethStakeType = signatureToStakeTypeMap[ethMethodId ?? ''];

    return ethStakeType;
};

const getStakeOperationName = (type: StakeType, isPending: boolean): TxKeyPath => {
    switch (type) {
        case 'stake':
            return isPending ? 'transactions.name.staking' : 'transactions.name.stake';
        case 'unstake':
            return isPending ? 'transactions.name.unstaking' : 'transactions.name.unstake';
        case 'claim':
            return isPending ? 'transactions.name.claiming' : 'transactions.name.claim';
        default:
            return isPending ? 'transactions.name.pending' : 'transactions.name.unknown';
    }
};

export const getTransactionName = (
    transaction: WalletAccountTransaction,
    isPending: boolean,
): TxKeyPath => {
    const stakeOperationType = getStakingOperationType(transaction);

    if (stakeOperationType) {
        return getStakeOperationName(stakeOperationType, isPending);
    }

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

export const TransactionName = ({ transaction, isPending, variant }: TransactionNameProps) => {
    const ethName = transaction.ethereumSpecific?.parsedData?.name;

    // Stellar trustline addition/removal (short version without asset code)
    if (
        transaction.stellarSpecific?.operationType === 'changeTrust' &&
        transaction.stellarSpecific?.changeTrust
    ) {
        return (
            <Text variant={variant}>
                {transaction.stellarSpecific.changeTrust.isRemoval ? (
                    <Translation id="transactions.name.stellarTrustlineRemoved" />
                ) : (
                    <Translation id="transactions.name.stellarTrustlineAdded" />
                )}
            </Text>
        );
    }

    return (
        <Text variant={variant}>
            {
                // use name of eth txns, but not for recv or sent Transfer
                ethName ? ethName : <Translation id={getTransactionName(transaction, isPending)} />
            }
        </Text>
    );
};
