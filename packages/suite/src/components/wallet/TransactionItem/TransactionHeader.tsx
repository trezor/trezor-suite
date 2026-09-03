import { Translation, useTranslation } from '@suite/intl';
import { redactNumericalSubstring, useDiscreetMode } from '@suite-common/discreet-mode';
import { getNetworkDisplaySymbol, isNetworkSymbol } from '@suite-common/wallet-config';
import { type TronTxContractType } from '@suite-common/wallet-constants';
import {
    isCardanoStakingTx,
    isSupportedEthStakingNetworkSymbol,
    isSupportedSolStakingNetworkSymbol,
} from '@suite-common/wallet-core';
import { type StakeType } from '@suite-common/wallet-types';
import { getNativeWrapTxKind, getTxHeaderSymbol } from '@suite-common/wallet-utils';
import { type AccountTransaction } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { UnstakingTxAmount } from 'src/components/suite/UnstakingTxAmount';
import { WrapTxAmount } from 'src/components/suite/WrapTxAmount';
import { type WalletAccountTransaction } from 'src/types/wallet';
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
        case 'governance_delegation':
            return 'TR_STAKE_VOTING_DELEGATION';
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
    if (isCardanoStakingTx(transaction)) {
        return getSelfTransactionMessageByType({
            type: transaction.cardanoSpecific?.subtype,
            isPending,
        });
    }

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
            return isPending ? 'TR_SENDING_SYMBOL_TO_SELF' : 'TR_SENT_SYMBOL_TO_SELF';
        case 'unknown':
        default:
            return 'TR_UNKNOWN_TRANSACTION';
    }
};

const getSolTransactionStakeTypeName = (stakeType: StakeType) => {
    switch (stakeType) {
        case 'stake':
            return 'TR_TX_STAKE_STAKE';
        case 'unstake':
            return 'TR_TX_STAKE_UNSTAKE';
        case 'claim':
            return 'TR_TX_STAKE_CLAIM';
    }
};

const getTronTransactionMessageId = (transaction: WalletAccountTransaction) => {
    const contractType = transaction.tronSpecific?.contractType as TronTxContractType;

    switch (contractType) {
        case 'AccountCreateContract':
            return 'TR_TRON_TX_CREATE_ACCOUNT';
        case 'AccountUpdateContract':
            return 'TR_TRON_TX_UPDATE_ACCOUNT';
        case 'CreateSmartContract':
            return 'TR_TRON_TX_DEPLOY_SMART_CONTRACT';
        case 'VoteWitnessContract':
            return 'TR_TRON_TX_VOTE_WITNESS';
        case 'FreezeBalanceContract':
        case 'FreezeBalanceV2Contract':
            return 'TR_TRON_TX_FREEZE_BALANCE';
        case 'UnfreezeBalanceContract':
        case 'UnfreezeBalanceV2Contract':
            return 'TR_TRON_TX_UNFREEZE_BALANCE';
        case 'WithdrawExpireUnfreezeContract':
            return 'TR_TRON_TX_WITHDRAW_BALANCE';
        case 'WithdrawBalanceContract':
            return 'TR_TRON_TX_CLAIM_REWARDS';
        case 'DelegateResourceContract':
            return 'TR_TRON_TX_DELEGATE_RESOURCE';
        case 'UnDelegateResourceContract':
            return 'TR_TRON_TX_UNDELEGATE_RESOURCE';
        default:
            return undefined;
    }
};

export const TransactionHeader = ({ transaction, isPending }: TransactionHeaderProps) => {
    const { translationString } = useTranslation();
    const { isDiscreetMode } = useDiscreetMode();

    if (isPending && (transaction.ethereumSpecific || transaction.cardanoSpecific)) {
        return <Translation id="TR_UNCONFIRMED_TX_LONG" />;
    }

    if (transaction.type === 'failed') {
        return <Translation id="TR_FAILED_TRANSACTION" />;
    }

    // WETH wrap/unwrap are shown as their own labels instead of the generic contract-call name
    // ("deposit"/"withdraw") that the indexer parses. The wrapped-token amount isn't obvious from
    // the transaction row, so it's spelled out while the native side stays a bare symbol
    // ("Wrap ETH into 0.1 WETH" / "Unwrap 0.1 WETH to ETH", see trezor/trezor-suite#30552).
    const wrapKind = getNativeWrapTxKind(transaction);
    if (wrapKind) {
        return (
            <Translation
                id={wrapKind === 'wrap' ? 'TR_TX_WRAP' : 'TR_TX_UNWRAP'}
                values={{
                    nativeSymbol: getNetworkDisplaySymbol(transaction.symbol),
                    wrappedAmount: <WrapTxAmount transaction={transaction} wrapped />,
                }}
            />
        );
    }

    if (
        transaction?.ethereumSpecific?.parsedData?.name &&
        // Exclude Transfer txs, the default messages are more descriptive
        transaction.ethereumSpecific.parsedData.name !== 'Transfer'
    ) {
        return (
            <>
                {transaction.ethereumSpecific.parsedData.name}
                {isSupportedEthStakingNetworkSymbol(transaction.symbol) && (
                    <UnstakingTxAmount transaction={transaction} />
                )}
            </>
        );
    }

    const tronTransactionMessageId = getTronTransactionMessageId(transaction);
    if (tronTransactionMessageId) {
        const contractType = transaction.tronSpecific?.contractType;

        const votes = transaction.tronSpecific?.votes;
        if (contractType === 'VoteWitnessContract' && votes?.length) {
            const totalVotes = votes
                .reduce((sum, vote) => sum.plus(vote.count ?? '0'), new BigNumber(0))
                .toString();
            const displayedVotes = isDiscreetMode
                ? redactNumericalSubstring(totalVotes)
                : totalVotes;

            return (
                <BlurUrls
                    text={translationString('TR_TRON_TX_VOTED_VOTES', { votes: displayedVotes })}
                />
            );
        }

        const isUnfreeze =
            contractType === 'UnfreezeBalanceContract' ||
            contractType === 'UnfreezeBalanceV2Contract';

        return (
            <>
                <BlurUrls text={translationString(tronTransactionMessageId)} />
                {isUnfreeze && <UnstakingTxAmount transaction={transaction} />}
            </>
        );
    }

    const solanaStakeType = transaction?.solanaSpecific?.stakeOperation?.type;
    if (solanaStakeType) {
        const translationId = getSolTransactionStakeTypeName(solanaStakeType);

        return (
            <>
                {translationId && <Translation id={translationId} />}
                {isSupportedSolStakingNetworkSymbol(transaction.symbol) && (
                    <UnstakingTxAmount transaction={transaction} />
                )}
            </>
        );
    }

    // Stellar trustline addition/removal
    if (
        transaction.stellarSpecific?.operationType === 'changeTrust' &&
        transaction.stellarSpecific?.changeTrust
    ) {
        const translationId = transaction.stellarSpecific.changeTrust.isRemoval
            ? 'TR_STELLAR_TRUSTLINE_REMOVED'
            : 'TR_STELLAR_TRUSTLINE_ADDED';

        return (
            <BlurUrls
                text={translationString(translationId, {
                    assetCode: transaction.stellarSpecific.changeTrust.assetCode,
                })}
            />
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

        if (fromSymbol && toSymbol && !transaction.cardanoSpecific) {
            return (
                <BlurUrls
                    text={translationString('TR_SWAP_TRANSACTION', { fromSymbol, toSymbol })}
                />
            );
        }
    }

    const isMultiTokenTransaction = transaction.tokens.length > 1;
    const transactionSymbol = getTxHeaderSymbol(transaction);
    // token symbols carry their own casing (trSHUSDTp), only network symbols are stored lowercase
    const symbol =
        transactionSymbol && isNetworkSymbol(transactionSymbol)
            ? getNetworkDisplaySymbol(transactionSymbol)
            : transactionSymbol;

    return (
        <BlurUrls
            text={translationString(getTransactionMessageId({ transaction, isPending }), {
                symbol,
                multiple: isMultiTokenTransaction,
            })}
        />
    );
};
