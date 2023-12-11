import { TranslationKey } from '@suite-common/intl-types';
import { StakeFormState } from '@suite-common/wallet-types';

interface getTransactionReviewModalActionTextParams {
    ethereumStakeType: StakeFormState['ethereumStakeType'] | null;
    isRbfAction: boolean;
}

export const getTransactionReviewModalActionText = ({
    ethereumStakeType,
    isRbfAction,
}: getTransactionReviewModalActionTextParams): TranslationKey => {
    switch (ethereumStakeType) {
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

    return 'SEND_TRANSACTION';
};
