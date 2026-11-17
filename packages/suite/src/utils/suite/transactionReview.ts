import { type TranslationKey } from '@suite/intl';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type FormState, type StakeFormState } from '@suite-common/wallet-types';
import { getEvmTransactionPurpose } from '@suite-common/wallet-utils';
import { getWrappedNativeSymbol } from '@trezor/network-ethereum-suite-common';

type TransactionReviewModalAsset = {
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
};

export type TransactionReviewModalAction = {
    id: TranslationKey;
    values?: Record<string, string | undefined>;
    /** Placeholders filled with an asset's symbol, which the UI renders and masks. */
    assets?: Record<string, TransactionReviewModalAsset>;
};

type GetTransactionReviewModalActionParams = {
    networkSymbol: NetworkSymbol;
    stakeType: StakeFormState['stakeType'] | null;
    precomposedForm: FormState | StakeFormState;
    approvalTokenContract: TokenAddress | undefined;
    routeName?: string;
    isBumpFeeRbfAction: boolean;
    isCancelRbfAction: boolean;
    isSending?: boolean;
    source: 'heading' | 'button';
};

export const getTransactionReviewModalAction = ({
    networkSymbol,
    stakeType,
    precomposedForm,
    approvalTokenContract,
    routeName,
    isBumpFeeRbfAction,
    isCancelRbfAction,
    isSending,
    source,
}: GetTransactionReviewModalActionParams): TransactionReviewModalAction => {
    const txPurpose = getEvmTransactionPurpose({
        networkSymbol,
        to: precomposedForm.outputs?.[0]?.address,
        data: precomposedForm.transactionData,
    });

    switch (stakeType) {
        case 'stake':
            return {
                id: source === 'heading' ? 'TR_EARN_STAKE_TOKEN' : 'TR_STAKE_STAKE',
                assets: { symbol: { networkSymbol } },
            };
        case 'unstake':
            return {
                id: source === 'heading' ? 'TR_STAKE_UNSTAKE_TOKEN' : 'TR_STAKE_UNSTAKE',
                assets: { symbol: { networkSymbol } },
            };
        case 'claim':
            return {
                id: source === 'heading' ? 'TR_STAKE_CLAIM_TOKEN' : 'TR_STAKE_CLAIM',
                assets: { symbol: { networkSymbol } },
            };
        // no default
    }

    if (isBumpFeeRbfAction) {
        return { id: 'TR_REPLACE_TX' };
    }

    if (isCancelRbfAction) {
        return { id: 'TR_CANCEL_TX_BUTTON' };
    }

    // Approvals are signed from flows that do not share a single form state (trading composes
    // through the trading thunks, earn through the allowance ones), so the action is resolved
    // from the calldata rather than from the originating form or route.
    if (txPurpose === 'approve' || txPurpose === 'revoke') {
        const isApprove = txPurpose === 'approve';
        if (source === 'button' || !approvalTokenContract) {
            return { id: isApprove ? 'TR_APPROVE_DATA_TITLE' : 'TR_REVOKE_DATA_TITLE' };
        }

        return {
            id: isApprove
                ? 'TR_APPROVAL_APPROVE_TOKEN_SPENDING'
                : 'TR_APPROVAL_REVOKE_TOKEN_SPENDING',
            assets: {
                displaySymbol: { networkSymbol, contractAddress: approvalTokenContract },
            },
        };
    }

    if (precomposedForm?.trading?.activeSection === 'sell') {
        return { id: 'TR_TRADING_SELL' };
    }

    if (precomposedForm?.trading?.activeSection === 'exchange') {
        return { id: 'TR_TRADING_SWAP' };
    }

    if (txPurpose === 'wrap' || txPurpose === 'unwrap') {
        if (source === 'heading') {
            return {
                id:
                    txPurpose === 'wrap'
                        ? 'TR_EARN_YIELD_WRAP_TITLE'
                        : 'TR_EARN_YIELD_UNWRAP_TITLE',
                values: { tokenSymbol: getWrappedNativeSymbol(networkSymbol) },
                assets: { nativeSymbol: { networkSymbol } },
            };
        }

        return {
            id: txPurpose === 'wrap' ? 'TR_WRAP_NATIVE_TOKEN' : 'TR_UNWRAP_NATIVE_TOKEN',
        };
    }

    if (routeName === 'earn-yield-deposit') {
        return {
            id: source === 'heading' ? 'TR_EARN_YIELD_DEPOSIT' : 'TR_EARN_YIELD_DEPOSIT_BUTTON',
        };
    }

    if (routeName === 'earn-yield-withdraw') {
        if (txPurpose === 'redeem') {
            return { id: 'TR_EARN_YIELD_REDEEM' };
        }

        return {
            id: source === 'heading' ? 'TR_EARN_YIELD_WITHDRAW_TITLE' : 'TR_EARN_YIELD_WITHDRAW',
        };
    }

    if (routeName === 'earn-yield-claim') {
        return {
            id: source === 'heading' ? 'TR_EARN_YIELD_CLAIM_REWARDS' : 'TR_EARN_YIELD_CLAIM',
        };
    }

    if (routeName === 'earn-tron-withdraw') {
        return { id: 'TR_EARN_TRON_WITHDRAW_TITLE' };
    }

    if (routeName === 'earn-tron-claim') {
        return { id: 'TR_EARN_TRON_CLAIM_TITLE' };
    }

    if (
        precomposedForm.tronStaking?.kind === 'freeze' ||
        precomposedForm.tronStaking?.kind === 'unstake'
    ) {
        return {
            id:
                precomposedForm.tronStaking.kind === 'unstake'
                    ? 'TR_EARN_TRON_UNSTAKE_TITLE'
                    : 'TR_EARN_TRON_FREEZE',
        };
    }

    if (precomposedForm.tronStaking?.kind === 'vote') {
        return { id: 'TR_EARN_TRON_VOTE' };
    }

    if (isSending) {
        return { id: 'TR_CONFIRMING_TX' };
    }

    return { id: 'SEND_TRANSACTION' };
};
