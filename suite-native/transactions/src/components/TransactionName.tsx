import { redactNumericalSubstring, useDiscreetMode } from '@suite-common/discreet-mode';
import { useFormatters } from '@suite-common/formatters';
import { type TronTxContractType } from '@suite-common/wallet-constants';
import { type StakeType, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { getNativeWrapTxKind, getTxStakeType } from '@suite-common/wallet-utils';
import { Text, type TextProps } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { getUnstakeTxAmount } from '../utils';
import { UnstakeTransactionDetailTitle } from './UnstakeTransactionDetailTitle';
import { WrapTransactionName } from './WrapTransactionName';

type TransactionNameProps = TextProps & {
    transaction: WalletAccountTransaction;
    isPending: boolean;
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

export const TransactionName = ({ transaction, isPending, ...textProps }: TransactionNameProps) => {
    const { CryptoAmountFormatter: cryptoAmountFormatter } = useFormatters();
    const { isDiscreetMode } = useDiscreetMode();
    const ethName = transaction.ethereumSpecific?.parsedData?.name;

    if (transaction.type === 'failed') {
        return (
            <Text {...textProps}>
                <Translation id="transactions.name.failed" />
            </Text>
        );
    }

    // WETH wrap/unwrap get their own label (with the amount) instead of the generic contract-call
    // method name ("deposit"/"withdraw") that the indexer parses.
    const wrapKind = getNativeWrapTxKind(transaction);
    if (wrapKind) {
        return <WrapTransactionName transaction={transaction} kind={wrapKind} {...textProps} />;
    }

    // Stellar trustline addition/removal (short version without asset code)
    if (
        transaction.stellarSpecific?.operationType === 'changeTrust' &&
        transaction.stellarSpecific?.changeTrust
    ) {
        return (
            <Text {...textProps}>
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
        const { contractType, votes, unstakeAmount } = transaction.tronSpecific ?? {};

        if (contractType === 'VoteWitnessContract' && votes?.length) {
            const totalVotes = votes
                .reduce((sum, vote) => sum.plus(vote.count ?? '0'), new BigNumber(0))
                .toString();
            const displayedVotes = isDiscreetMode
                ? redactNumericalSubstring(totalVotes)
                : totalVotes;

            return (
                <Text {...textProps}>
                    <Translation
                        id="transactions.name.tron.votedVotes"
                        values={{ votes: displayedVotes }}
                    />
                </Text>
            );
        }

        const isUnfreeze =
            contractType === 'UnfreezeBalanceContract' ||
            contractType === 'UnfreezeBalanceV2Contract';

        if (isUnfreeze && unstakeAmount) {
            const formattedUnfreezeAmount = cryptoAmountFormatter.format(unstakeAmount, {
                symbol: transaction.symbol,
                isBalance: false,
                isEllipsisAppended: false,
            });
            const displayedUnfreezeAmount = isDiscreetMode
                ? redactNumericalSubstring(formattedUnfreezeAmount)
                : formattedUnfreezeAmount;

            return (
                <Text {...textProps}>
                    <Translation id={tronTransactionMessageId} /> {displayedUnfreezeAmount}
                </Text>
            );
        }

        return (
            <Text {...textProps}>
                <Translation id={tronTransactionMessageId} />
            </Text>
        );
    }

    const stakeType = getTxStakeType(transaction);
    const unstakeAmount = getUnstakeTxAmount(transaction);

    if (unstakeAmount !== undefined && !isPending) {
        return (
            <UnstakeTransactionDetailTitle
                unstakeAmount={unstakeAmount}
                symbol={transaction.symbol}
                {...textProps}
            />
        );
    }

    const stakeTranslationId = stakeType ? getStakeTransactionMessage(stakeType, isPending) : null;

    // The contract method name (e.g. "Transfer") must not override the "self" label for
    // self-transactions, otherwise sending to your own account shows up as a generic transfer.
    const ethNameToDisplay = transaction.type === 'self' ? undefined : ethName;

    return (
        <Text {...textProps}>
            {stakeTranslationId ? (
                <Translation id={stakeTranslationId} />
            ) : (
                // use name of eth txns, but not for recv or sent Transfer
                ethNameToDisplay || <Translation id={getTransactionName(transaction, isPending)} />
            )}
        </Text>
    );
};
