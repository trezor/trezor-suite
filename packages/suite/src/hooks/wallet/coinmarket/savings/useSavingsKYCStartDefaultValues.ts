import type { SavingsInfo } from '@wallet-actions/coinmarketSavingsActions';
import { useMemo } from 'react';

export const useSavingsKYCStartDefaultValues = (savingsInfo?: SavingsInfo) => {
    const provider = useMemo(
        () => savingsInfo?.savingsList?.providers?.[0],
        [savingsInfo?.savingsList?.providers],
    );
    const defaultDocumentType = useMemo(() => {
        const identityDocumentType = provider?.identityDocuments[0].documentType || 'Passport';
        return { label: identityDocumentType, value: identityDocumentType };
    }, [provider]);
    const documentTypes = useMemo(
        () =>
            provider?.identityDocuments
                // Selfie is managed separately.
                .filter(item => item.documentType !== 'Selfie'),
        [provider],
    );
    const defaultValues = useMemo(
        () =>
            savingsInfo
                ? {
                      documentType: defaultDocumentType,
                  }
                : undefined,
        [savingsInfo, defaultDocumentType],
    );
    const isSelfieRequired = provider?.identityDocuments.some(
        item => item.documentType === 'Selfie' && item.isRequired,
    );
    return {
        defaultValues,
        defaultDocumentType,
        documentTypes,
        isSelfieRequired,
    };
};
