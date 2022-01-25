import React from 'react';
import { Button, Checkbox, Icon, Select, Tooltip } from '@trezor/components';
import { useSavingsKYCStart } from '@wallet-hooks/coinmarket/savings/useSavingsKYCStart';
import styled from 'styled-components';
import { isDesktop } from '@suite-utils/env';
import { Translation, TrezorLink } from '@suite-components';
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

const LinkIcon = styled(Icon)`
    margin-left: 6px;
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const PrivacyPolicyCheckboxLabelTranslation = styled(Translation)`
    display: flex;
    align-items: center;
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
        formState,
        watch,
        handleSubmit,
        frontDropzoneState,
        backDropzoneState,
        selfieDropzoneState,
        defaultDocumentType,
        isSelfieRequired,
        documentTypes,
        provider,
    } = useSavingsKYCStart(props);

    const documentTypeSelectName = 'documentType';
    const documentImageFrontInputName = 'documentImageFront';
    const documentImageBackInputName = 'documentImageBack';
    const documentImageSelfieInputName = 'documentImageSelfie';
    const privacyPolicyAgreementInputName = 'privacyPolicyAgreement';

    const selectedDocumentType = watch(documentTypeSelectName, defaultDocumentType);
    const privacyPolicyAgreement = watch(
        privacyPolicyAgreementInputName,
        !provider?.privacyPolicyUrl,
    );
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

    const canSubmit = formState.isValid && privacyPolicyAgreement;

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
                            <Translation
                                id={
                                    selectedDocumentType.value === 'Passport'
                                        ? 'TR_SAVINGS_KYC_START_DOCUMENT_DROPZONE_ID_SIDE_LABEL'
                                        : 'TR_SAVINGS_KYC_START_DOCUMENT_DROPZONE_FRONT_LABEL'
                                }
                            />
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
            {provider?.privacyPolicyUrl && (
                <Row>
                    <Controller
                        control={control}
                        name={privacyPolicyAgreementInputName}
                        defaultValue={privacyPolicyAgreement}
                        render={({ onChange, value }) => (
                            <Checkbox isChecked={value} onClick={() => onChange(!value)}>
                                <PrivacyPolicyCheckboxLabelTranslation
                                    isNested
                                    id="TR_SAVINGS_KYC_START_AGREE_WITH_TERMS"
                                    values={{
                                        providerName: provider.companyName,
                                        link: (
                                            <TrezorLink
                                                variant="nostyle"
                                                href={provider.privacyPolicyUrl}
                                                target="_blank"
                                            >
                                                <Tooltip
                                                    content={
                                                        <Translation
                                                            id={
                                                                isDesktop()
                                                                    ? 'TR_OPEN_IN_BROWSER'
                                                                    : 'TR_OPEN_IN_NEW_TAB'
                                                            }
                                                        />
                                                    }
                                                >
                                                    <LinkIcon size={14} icon="EXTERNAL_LINK" />
                                                </Tooltip>
                                            </TrezorLink>
                                        ),
                                    }}
                                />
                            </Checkbox>
                        )}
                    />
                </Row>
            )}

            <Button isDisabled={!canSubmit}>
                <Translation id="TR_SAVINGS_KYC_START_CONFIRM" />
            </Button>
        </form>
    );
};

export default withInvityLayout(KYCStart);
