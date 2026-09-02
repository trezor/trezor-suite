import { type ExtendedMessageDescriptor } from '@suite/intl';
import {
    type NetworkSymbol,
    getDisplaySymbol,
    getNetworkDisplaySymbol,
} from '@suite-common/wallet-config';
import { type FormState, type StakeFormState } from '@suite-common/wallet-types';
import { getEvmTransactionPurpose } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { getWrappedNativeSymbol } from '@trezor/network-ethereum-suite-common';

type GetTransactionReviewModalActionTranslationParams = {
    symbol: NetworkSymbol;
    stakeType: StakeFormState['stakeType'] | null;
    precomposedForm: FormState | StakeFormState;
    approvalToken: TokenInfo | undefined;
    routeName?: string;
    isBumpFeeRbfAction: boolean;
    isCancelRbfAction: boolean;
    isSending?: boolean;
    source: 'heading' | 'button';
};

export const getTransactionReviewModalActionTranslation = ({
    symbol,
    stakeType,
    precomposedForm,
    approvalToken,
    routeName,
    isBumpFeeRbfAction,
    isCancelRbfAction,
    isSending,
    source,
}: GetTransactionReviewModalActionTranslationParams): ExtendedMessageDescriptor => {
    const txPurpose = getEvmTransactionPurpose({
        networkSymbol: symbol,
        to: precomposedForm.outputs?.[0]?.address,
        data: precomposedForm.transactionData,
    });

    switch (stakeType) {
        case 'stake':
            return {
                id: source === 'heading' ? 'TR_EARN_STAKE_TOKEN' : 'TR_STAKE_STAKE',
                values: { symbol: getNetworkDisplaySymbol(symbol) },
            };
        case 'unstake':
            return {
                id: source === 'heading' ? 'TR_STAKE_UNSTAKE_TOKEN' : 'TR_STAKE_UNSTAKE',
                values: { symbol: getNetworkDisplaySymbol(symbol) },
            };
        case 'claim':
            return {
                id: source === 'heading' ? 'TR_STAKE_CLAIM_TOKEN' : 'TR_STAKE_CLAIM',
                values: { symbol: getNetworkDisplaySymbol(symbol) },
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
        const displaySymbol = approvalToken?.symbol
            ? getDisplaySymbol(approvalToken.symbol, approvalToken.contract)
            : undefined;

        if (source === 'button' || !displaySymbol) {
            return { id: isApprove ? 'TR_APPROVE_DATA_TITLE' : 'TR_REVOKE_DATA_TITLE' };
        }

        return {
            id: isApprove
                ? 'TR_APPROVAL_APPROVE_TOKEN_SPENDING'
                : 'TR_APPROVAL_REVOKE_TOKEN_SPENDING',
            values: { displaySymbol },
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
                values: {
                    nativeSymbol: getNetworkDisplaySymbol(symbol),
                    tokenSymbol: getWrappedNativeSymbol(symbol),
                },
            };
        }

        return {
            id: txPurpose === 'wrap' ? 'TR_WRAP_NATIVE_TOKEN' : 'TR_UNWRAP_NATIVE_TOKEN',
        };
    }

    if (routeName === 'earn-yield-deposit') {
        return { id: 'TR_EARN_YIELD_DEPOSIT' };
    }

    if (routeName === 'earn-yield-withdraw') {
        return {
            id: txPurpose === 'redeem' ? 'TR_EARN_YIELD_REDEEM' : 'TR_EARN_YIELD_WITHDRAW',
        };
    }

    if (routeName === 'earn-yield-claim') {
        return { id: source === 'heading' ? 'TR_EARN_CLAIM_REWARDS' : 'TR_EARN_YIELD_CLAIM' };
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
