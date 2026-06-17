import { type ExtendedMessageDescriptor } from '@suite/intl';
import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type FormState, type StakeFormState } from '@suite-common/wallet-types';
import { getEvmTransactionTextSignature } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';

interface GetTransactionReviewModalActionTranslationParams {
    symbol: NetworkSymbol;
    stakeType: StakeFormState['stakeType'] | null;
    precomposedForm: FormState | StakeFormState;
    tradingToken: TokenInfo | undefined;
    routeName?: string;
    isBumpFeeRbfAction: boolean;
    isCancelRbfAction: boolean;
    isSending?: boolean;
    source: 'heading' | 'button';
}

export const getTransactionReviewModalActionTranslation = ({
    symbol,
    stakeType,
    precomposedForm,
    tradingToken,
    routeName,
    isBumpFeeRbfAction,
    isCancelRbfAction,
    isSending,
    source,
}: GetTransactionReviewModalActionTranslationParams): ExtendedMessageDescriptor => {
    const txSignature = getEvmTransactionTextSignature(precomposedForm.transactionData);

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

    if (precomposedForm?.trading?.activeSection === 'sell') {
        return { id: 'TR_TRADING_SELL' };
    }

    if (precomposedForm?.trading?.activeSection === 'exchange') {
        switch (txSignature) {
            case 'approve':
                return {
                    id:
                        source === 'heading'
                            ? 'TR_TRADING_APPROVE_TOKEN'
                            : 'TR_TRADING_APPROVE_TOKEN_BUTTON',
                    values: { tokenSymbol: tradingToken?.symbol },
                };
            case 'revoke':
                return {
                    id:
                        source === 'heading'
                            ? 'TR_TRADING_REVOKE_TOKEN'
                            : 'TR_TRADING_REVOKE_TOKEN_BUTTON',
                    values: { tokenSymbol: tradingToken?.symbol },
                };
            default:
                return { id: 'TR_TRADING_SWAP' };
        }
    }

    if (
        (routeName === 'earn-yield-deposit' || routeName === 'earn-yield-withdraw') &&
        (txSignature === 'approve' || txSignature === 'revoke')
    ) {
        return {
            id: txSignature === 'approve' ? 'TR_APPROVE_DATA_TITLE' : 'TR_REVOKE_DATA_TITLE',
        };
    }

    if (isBumpFeeRbfAction) {
        return { id: 'TR_REPLACE_TX' };
    }

    if (isCancelRbfAction) {
        return { id: 'TR_CANCEL_TX_BUTTON' };
    }

    if (isSending) {
        return { id: 'TR_CONFIRMING_TX' };
    }

    if (routeName === 'earn-yield-deposit') {
        return { id: 'TR_EARN_YIELD_DEPOSIT' };
    }

    if (routeName === 'earn-yield-withdraw') {
        return {
            id: txSignature === 'redeem' ? 'TR_EARN_YIELD_REDEEM' : 'TR_EARN_YIELD_WITHDRAW',
        };
    }

    if (routeName === 'earn-yield-claim') {
        return { id: source === 'heading' ? 'TR_EARN_CLAIM_REWARDS' : 'TR_EARN_YIELD_CLAIM' };
    }

    if (routeName === 'earn-tron-withdraw') {
        return { id: 'TR_EARN_TRON_WITHDRAW_TITLE' };
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

    return { id: 'SEND_TRANSACTION' };
};
