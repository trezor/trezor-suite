import { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import { FormState, StakeFormState } from '@suite-common/wallet-types';
import { getEvmTransactionTextSignature } from '@suite-common/wallet-utils';
import { TokenInfo } from '@trezor/blockchain-link-types';

interface GetTransactionReviewModalActionTranslationParams {
    stakeType: StakeFormState['stakeType'] | null;
    precomposedForm: FormState | StakeFormState;
    tradingToken: TokenInfo | undefined;
    isBumpFeeRbfAction: boolean;
    isCancelRbfAction: boolean;
    isSending?: boolean;
    source: 'heading' | 'button';
}

export const getTransactionReviewModalActionTranslation = ({
    stakeType,
    precomposedForm,
    tradingToken,
    isBumpFeeRbfAction,
    isCancelRbfAction,
    isSending,
    source,
}: GetTransactionReviewModalActionTranslationParams): ExtendedMessageDescriptor => {
    switch (stakeType) {
        case 'stake':
            return { id: 'TR_STAKE_STAKE' };
        case 'unstake':
            return { id: 'TR_STAKE_UNSTAKE' };
        case 'claim':
            return { id: 'TR_STAKE_CLAIM' };
        // no default
    }

    if (precomposedForm?.trading?.activeSection === 'sell') {
        return { id: 'TR_TRADING_SELL' };
    }

    if (precomposedForm?.trading?.activeSection === 'exchange') {
        const transactionPurpose = getEvmTransactionTextSignature(precomposedForm.ethereumDataHex);

        switch (transactionPurpose) {
            case 'approval':
                return {
                    id:
                        source === 'heading'
                            ? 'TR_TRADING_APPROVE_TOKEN'
                            : 'TR_TRADING_APPROVE_TOKEN_BUTTON',
                    values: { tokenSymbol: tradingToken?.symbol?.toUpperCase() },
                };
            case 'revoke':
                return {
                    id:
                        source === 'heading'
                            ? 'TR_TRADING_REVOKE_TOKEN'
                            : 'TR_TRADING_REVOKE_TOKEN_BUTTON',
                    values: { tokenSymbol: tradingToken?.symbol?.toUpperCase() },
                };
            default:
                return { id: 'TR_TRADING_SWAP' };
        }
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

    return { id: 'SEND_TRANSACTION' };
};
