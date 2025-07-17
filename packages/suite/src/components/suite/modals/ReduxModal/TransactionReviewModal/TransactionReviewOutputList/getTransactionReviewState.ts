import { TransactionReviewOutputElementProps } from './TransactionReviewOutputElement';

export const getTransactionReviewState = (
    index: number, // index is either the current output index or the total number of outputs
    currentStep: number,
    hasSignedTx: boolean,
    lastButtonRequestCode?: string | null,
): TransactionReviewOutputElementProps['state'] => {
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
