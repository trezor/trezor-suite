import type { SavingsInfo } from '@wallet-actions/coinmarketSavingsActions';
import { useMemo } from 'react';
import regional from '@wallet-constants/coinmarket/regional';
import { Translation } from '@suite-components';
import { SavingsProviderInfoIdentityDocument } from '@suite-services/invityAPI';

type SavingsIdentityDocumentType = SavingsProviderInfoIdentityDocument['documentType'];
type SavingsIdentityDocumentTypeUpperCase = Uppercase<SavingsIdentityDocumentType>;

const translationSavingsKYCStartDocumentTypePrefix = 'TR_SAVINGS_KYC_START_DOCUMENT_TYPE_' as const;

type SavingsIdentityDocumentTypeTranslationIdType =
    `${typeof translationSavingsKYCStartDocumentTypePrefix}${SavingsIdentityDocumentTypeUpperCase}`;

const getSavingsIdentityDocumentTypeTranslationId = (
    identityDocumentType: SavingsIdentityDocumentType,
): SavingsIdentityDocumentTypeTranslationIdType =>
    `${translationSavingsKYCStartDocumentTypePrefix}${identityDocumentType.toUpperCase()}` as SavingsIdentityDocumentTypeTranslationIdType;

const getIdentityDocumentTypesOption = (identityDocumentType: SavingsIdentityDocumentType) => ({
    label: Translation({ id: getSavingsIdentityDocumentTypeTranslationId(identityDocumentType) }),
    value: identityDocumentType,
});

const getIdentityDocumentTypesOptions = (identityDocumentTypes?: SavingsIdentityDocumentType[]) =>
    identityDocumentTypes?.map(getIdentityDocumentTypesOption);

export const useSavingsKYCStartDefaultValues = (savingsInfo?: SavingsInfo) => {
    const provider = useMemo(
        () => savingsInfo?.savingsList?.providers?.[0],
        [savingsInfo?.savingsList?.providers],
    );
    const country = savingsInfo?.savingsList?.country || regional.unknownCountry;
    const defaultDocumentCountry = useMemo(
        () => regional.countriesOptions.find(item => item.value === country),
        [country],
    );
    const defaultDocumentType = useMemo(() => {
        const identityDocumentType = provider?.identityDocuments[0].documentType;
        return getIdentityDocumentTypesOption(identityDocumentType || 'Passport');
    }, [provider]);
    const documentCountryOptions = useMemo(
        () =>
            provider?.supportedCountries.map(item => ({
                label: regional.countriesMap.get(item) || regional.unknownCountry,
                value: item,
            })),
        [provider],
    );
    const documentTypeOptions = useMemo(
        () =>
            getIdentityDocumentTypesOptions(
                provider?.identityDocuments
                    // Selfie is managed separately.
                    .filter(item => item.documentType !== 'Selfie')
                    .map(item => item.documentType),
            ),
        [provider],
    );
    const defaultValues = useMemo(
        () =>
            savingsInfo
                ? {
                      documentCountry: defaultDocumentCountry,
                      documentType: defaultDocumentType,
                  }
                : undefined,
        [savingsInfo, defaultDocumentCountry, defaultDocumentType],
    );
    const isSelfieRequired = provider?.identityDocuments.some(
        item => item.documentType === 'Selfie' && item.isRequired,
    );
    return {
        defaultValues,
        defaultDocumentCountry,
        defaultDocumentType,
        documentTypeOptions,
        documentCountryOptions,
        isSelfieRequired,
    };
};
