import { type TronTxContractType } from '@suite-common/wallet-constants';
import { type StakeType, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { getTxStakeType } from '@suite-common/wallet-utils';
import { Text } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { type NativeTypographyStyle } from '@trezor/theme';
import { exhaustive } from '@trezor/type-utils';

type TransactionNameProps = {
    transaction: WalletAccountTransaction;
    isPending: boolean;
    variant?: NativeTypographyStyle;
};

interface GetSelfTransactionMessageByTypeProps {
    type?: Required<WalletAccountTransaction>['cardanoSpecific']['subtype'];
}

const getStakeTransactionMessage = (stakeType: StakeType, isPending: boolean): TxKeyPath | null => {
    switch (stakeType) {
        case 'stake':
            return isPending ? 'transactions.name.staking' : 'transactions.name.stake';
        case 'unstake':
            return isPending ? 'transactions.name.unstaking' : 'transactions.name.unstake';
        case 'claim':
            return isPending ? 'transactions.name.claiming' : 'transactions.name.claim';
        case 'change-delegate':
            return isPending
                ? 'transactions.name.changingDelegate'
                : 'transactions.name.changeDelegate';
        default:
            return exhaustive(stakeType);
    }
};

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

const getTronTransactionMessage = (transaction: WalletAccountTransaction) => {
    const contractType = transaction.tronSpecific?.contractType as TronTxContractType;

    switch (contractType) {
        case 'AccountCreateContract':
            return 'transactions.name.tron.createAccount';
        case 'AccountUpdateContract':
            return 'transactions.name.tron.updateAccount';
        case 'CreateSmartContract':
            return 'transactions.name.tron.deploySmartContract';
        case 'VoteWitnessContract':
            return 'transactions.name.tron.voteWitness';
        case 'FreezeBalanceContract':
        case 'FreezeBalanceV2Contract':
            return 'transactions.name.tron.freezeBalance';
        case 'UnfreezeBalanceContract':
        case 'UnfreezeBalanceV2Contract':
            return 'transactions.name.tron.unfreezeBalance';
        case 'WithdrawExpireUnfreezeContract':
            return 'transactions.name.tron.withdrawBalance';
        case 'WithdrawBalanceContract':
            return 'transactions.name.tron.claimRewards';
        case 'DelegateResourceContract':
            return 'transactions.name.tron.delegateResource';
        case 'UnDelegateResourceContract':
            return 'transactions.name.tron.undelegateResource';
        default:
            return undefined;
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

    // Tron-specific transactions
    const tronTransactionMessageId = getTronTransactionMessage(transaction);
    if (tronTransactionMessageId) {
        return (
            <Text variant={variant}>
                <Translation id={tronTransactionMessageId} />
            </Text>
        );
    }

    const stakeType = getTxStakeType(transaction);

    const stakeTranslationId = stakeType ? getStakeTransactionMessage(stakeType, isPending) : null;

    return (
        <Text variant={variant}>
            {stakeTranslationId ? (
                <Translation id={stakeTranslationId} />
            ) : (
                // use name of eth txns, but not for recv or sent Transfer
                ethName || <Translation id={getTransactionName(transaction, isPending)} />
            )}
        </Text>
    );
};
