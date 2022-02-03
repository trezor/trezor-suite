import type { SavingsProviderInfo } from '@suite/services/suite/invityAPI';
import { useMemo } from 'react';

export const useSavingsKYCStartDefaultValues = (selectedProvider?: SavingsProviderInfo) => {
    const defaultDocumentType = useMemo(() => {
        const identityDocumentType =
            selectedProvider?.identityDocuments[0].documentType || 'Passport';
        return { label: identityDocumentType, value: identityDocumentType };
    }, [selectedProvider]);
    const documentTypes = useMemo(
        () =>
            selectedProvider?.identityDocuments
                // Selfie is managed separately.
                .filter(item => item.documentType !== 'Selfie'),
        [selectedProvider],
    );
    const defaultValues = useMemo(
        () =>
            selectedProvider
                ? {
                      documentType: defaultDocumentType,
                  }
                : undefined,
        [selectedProvider, defaultDocumentType],
    );
    const isSelfieRequired = selectedProvider?.identityDocuments.some(
        item => item.documentType === 'Selfie' && item.isRequired,
    );
    return {
        defaultValues,
        defaultDocumentType,
        documentTypes,
        isSelfieRequired,
    };
};
