import React from 'react';
import { Button, Select } from '@trezor/components';
import { useSavingsKYCStart } from '@wallet-hooks/coinmarket/savings/useSavingsKYCStart';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { Controller } from 'react-hook-form';
import KYCImageDropzone from './components/KYCImageDropzone';
import { WithInvityLayoutProps, withInvityLayout } from '@wallet-components';
import {
    SavingsProviderInfoIdentityDocument,
    SavingsTradeUserKYCStartDocumentType,
} from '@suite/services/suite/invityAPI';
import type { SavingsKYCStartContextValues } from '@wallet-types/coinmarket/savings/KYCStart';

const Header = styled.div`
    font-style: normal;
    font-weight: normal;
    font-size: 24px;
    line-height: 24px;
    margin-bottom: 21px;
`;

const Row = styled.div`
    display: flex;
    padding: 0 0 10px 0;

    &:last-child {
        padding: 0;
    }
`;

type SavingsIdentityDocumentType = SavingsProviderInfoIdentityDocument['documentType'];
type SavingsIdentityDocumentTypeUpperCase = Uppercase<SavingsIdentityDocumentType>;

const translationSavingsKYCStartDocumentTypePrefix = 'TR_SAVINGS_KYC_START_DOCUMENT_TYPE_' as const;

type SavingsIdentityDocumentTypeTranslationIdType =
    `${typeof translationSavingsKYCStartDocumentTypePrefix}${SavingsIdentityDocumentTypeUpperCase}`;

const getSavingsIdentityDocumentTypeTranslationId = (
    identityDocumentType: SavingsIdentityDocumentType,
): SavingsIdentityDocumentTypeTranslationIdType =>
    identityDocumentType &&
    (`${translationSavingsKYCStartDocumentTypePrefix}${identityDocumentType.toUpperCase()}` as SavingsIdentityDocumentTypeTranslationIdType);

const getDocumentTypesOptions = (documentTypes: SavingsKYCStartContextValues['documentTypes']) =>
    documentTypes
        ?.filter(item => item.documentType !== 'Selfie')
        .map(item => ({
            label: item.documentType,
            value: item.documentType,
        }));

const KYCStart = (props: WithInvityLayoutProps) => {
    const {
        control,
        errors,
        onSubmit,
        watch,
        handleSubmit,
        frontDropzoneState,
        backDropzoneState,
        selfieDropzoneState,
        defaultDocumentType,
        isSelfieRequired,
        documentTypes,
    } = useSavingsKYCStart(props);

    const documentTypeSelectName = 'documentType';
    const documentImageFrontInputName = 'documentImageFront';
    const documentImageBackInputName = 'documentImageBack';
    const documentImageSelfieInputName = 'documentImageSelfie';

    const selectedDocumentType = watch(documentTypeSelectName, defaultDocumentType);
    const showFrontDropzone = documentTypes?.some(
        item =>
            item.documentType === selectedDocumentType.value &&
            item.documentImageSides.includes('Front'),
    );
    const showBackDropzone = documentTypes?.some(
        item =>
            item.documentType === selectedDocumentType.value &&
            item.documentImageSides.includes('Back'),
    );

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Header>
                <Translation id="TR_SAVINGS_KYC_START_HEADER" />
            </Header>
            <Row>
                <Controller
                    control={control}
                    name={documentTypeSelectName}
                    defaultValue={selectedDocumentType}
                    render={({ onChange, value }) => (
                        <Select
                            value={value}
                            label={<Translation id="TR_SAVINGS_KYC_START_DOCUMENT_TYPE_LABEL" />}
                            options={getDocumentTypesOptions(documentTypes)}
                            onChange={onChange}
                            formatOptionLabel={({ value }: any) => (
                                <Translation
                                    id={getSavingsIdentityDocumentTypeTranslationId(
                                        value as SavingsTradeUserKYCStartDocumentType,
                                    )}
                                />
                            )}
                        />
                    )}
                />
            </Row>
            {showFrontDropzone && (
                <Row>
                    <KYCImageDropzone
                        control={control}
                        name={documentImageFrontInputName}
                        dropzoneState={frontDropzoneState}
                        label={
                            <Translation id="TR_SAVINGS_KYC_START_DOCUMENT_DROPZONE_FRONT_LABEL" />
                        }
                        error={errors.documentImageFront}
                        required
                    />
                </Row>
            )}
            {showBackDropzone && (
                <Row>
                    <KYCImageDropzone
                        control={control}
                        name={documentImageBackInputName}
                        dropzoneState={backDropzoneState}
                        label={
                            <Translation id="TR_SAVINGS_KYC_START_DOCUMENT_DROPZONE_BACK_LABEL" />
                        }
                        error={errors.documentImageBack}
                        required
                    />
                </Row>
            )}
            {isSelfieRequired && (
                <Row>
                    <KYCImageDropzone
                        control={control}
                        name={documentImageSelfieInputName}
                        dropzoneState={selfieDropzoneState}
                        label={
                            <Translation id="TR_SAVINGS_KYC_START_DOCUMENT_DROPZONE_SELFIE_LABEL" />
                        }
                        error={errors.documentImageSelfie}
                        required
                    />
                </Row>
            )}
            <Button>
                <Translation id="TR_SAVINGS_KYC_START_CONFIRM" />
            </Button>
        </form>
    );
};

export default withInvityLayout(KYCStart);
