import type { SavingsInfo } from '@wallet-actions/coinmarketSavingsActions';
import { useMemo } from 'react';
import regional from '@wallet-constants/coinmarket/regional';
import { Translation } from '@suite-components';
import { SavingsIdentityDocumentType } from '@suite/services/suite/invityAPI';

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
        const identityDocumentType = provider?.identityDocumentTypes[0];
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
        () => getIdentityDocumentTypesOptions(provider?.identityDocumentTypes),
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
    return {
        defaultValues,
        defaultDocumentCountry,
        defaultDocumentType,
        documentTypeOptions,
        documentCountryOptions,
    };
};
