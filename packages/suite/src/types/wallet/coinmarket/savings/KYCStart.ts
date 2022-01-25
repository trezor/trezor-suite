import type { TypedValidationRules } from '@wallet-types/form';
import type { DropzoneState } from 'react-dropzone';
import type { UseFormMethods } from 'react-hook-form';
import type { WithSelectedAccountLoadedProps } from '@wallet-components';
import type {
    SavingsListResponse,
    SavingsProviderInfo,
    SavingsTradeUserKYCStartDocumentType,
} from '@suite-services/invityAPI';

export type UseSavingsKYCStartProps = WithSelectedAccountLoadedProps;

interface IdentityDocumentTypeOption {
    label: SavingsTradeUserKYCStartDocumentType;
    value: SavingsTradeUserKYCStartDocumentType;
}

export interface SavingsKYCStartFormState {
    documentType: IdentityDocumentTypeOption;
    documentImageFront: string;
    documentImageBack: string;
    documentImageSelfie?: string;
    privacyPolicyAgreement: boolean;
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
    defaultDocumentType?: IdentityDocumentTypeOption;
    documentTypes?: SavingsListResponse['providers'][0]['identityDocuments'];
    isSelfieRequired?: boolean;
    provider?: SavingsProviderInfo;
};
