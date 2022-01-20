import type { TypedValidationRules } from '@wallet-types/form';
import type { DropzoneState } from 'react-dropzone';
import type { UseFormMethods } from 'react-hook-form';
import type { Option, TranslationOption } from '@wallet-types/coinmarketCommonTypes';
import type { WithSelectedAccountLoadedProps } from '@wallet-components';

export type UseSavingsKYCStartProps = WithSelectedAccountLoadedProps;

export interface SavingsKYCStartFormState {
    documentCountry: Option;
    documentType: TranslationOption;
    documentNumber: string;
    documentImageFront: string;
    documentImageBack: string;
    documentImageSelfie?: string;
}

export type SavingsKYCStartContextValues = Omit<
    UseFormMethods<SavingsKYCStartFormState>,
    'register'
> & {
    register: (rules?: TypedValidationRules) => (ref: any) => void; // TODO: ReturnType of UseFormMethods['register'] union
    onSubmit: () => void;
    isLoading: boolean;
    frontDropzoneState: DropzoneState;
    backDropzoneState: DropzoneState;
    selfieDropzoneState: DropzoneState;
    defaultDocumentCountry?: Option;
    defaultDocumentType?: TranslationOption;
    documentCountryOptions?: Option[];
    documentTypeOptions?: TranslationOption[];
    isSelfieRequired?: boolean;
};
