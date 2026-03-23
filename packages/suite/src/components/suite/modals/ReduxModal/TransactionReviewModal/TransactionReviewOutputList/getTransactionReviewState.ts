import { type TransactionReviewOutputElementProps } from './TransactionReviewOutputElement';

type GetTransactionReviewStateParams = {
    index: number; // index is either the current output index or the total number of outputs
    currentStep: number;
    hasSignedTx: boolean;
    lastButtonRequestCode?: string | null;
};

export const getTransactionReviewState = ({
    index,
    currentStep,
    hasSignedTx,
    lastButtonRequestCode,
}: GetTransactionReviewStateParams): TransactionReviewOutputElementProps['state'] => {
    if (hasSignedTx || index < currentStep) {
        if (lastButtonRequestCode !== undefined) {
            return lastButtonRequestCode === 'ButtonRequest_SignTx' || hasSignedTx
                ? 'confirmed'
                : 'unconfirmed';
        }

        return 'confirmed';
    }

    if (index === currentStep) {
        return 'active';
    }

    return 'unconfirmed';
};
