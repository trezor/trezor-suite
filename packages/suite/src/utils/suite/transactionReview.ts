import { TranslationKey } from '@suite-common/intl-types';
import { StakeFormState } from '@suite-common/wallet-types';

interface getTransactionReviewModalActionTextParams {
    stakeType: StakeFormState['stakeType'] | null;
    isRbfAction: boolean;
    isSending?: boolean;
}

export const getTransactionReviewModalActionText = ({
    stakeType,
    isRbfAction,
    isSending,
}: getTransactionReviewModalActionTextParams): TranslationKey => {
    switch (stakeType) {
        case 'stake':
            return 'TR_STAKE_STAKE';
        case 'unstake':
            return 'TR_STAKE_UNSTAKE';
        case 'claim':
            return 'TR_STAKE_CLAIM';
        // no default
    }

    if (isRbfAction) {
        return 'TR_REPLACE_TX';
    }

    if (isSending) {
        return 'TR_CONFIRMING_TX';
    }

    return 'SEND_TRANSACTION';
};
