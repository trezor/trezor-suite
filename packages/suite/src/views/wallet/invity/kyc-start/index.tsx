import React from 'react';
import { Button, Flag, Input, Select, variables } from '@trezor/components';
import { useSavingsKYCStart } from '@wallet-hooks/coinmarket/savings/useSavingsKYCStart';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { Controller } from 'react-hook-form';
import type { CountryOption } from '@wallet-types/coinmarketCommonTypes';
import { getCountryLabelParts } from '@wallet-utils/coinmarket/coinmarketUtils';
import KYCImageDropzone from './components/KYCImageDropzone';
import { InputError, WithInvityLayoutProps, withInvityLayout } from '@wallet-components';
import { getInputState } from '@wallet-views/coinmarket';

const Header = styled.div`
    font-style: normal;
    font-weight: normal;
    font-size: 24px;
    line-height: 24px;
    margin-bottom: 21px;
`;

const OptionLabel = styled.div`
    display: flex;
    align-items: center;
`;

const FlagWrapper = styled.div`
    padding-right: 10px;
`;

const LabelText = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const Row = styled.div`
    display: flex;
    padding: 0 0 10px 0;

    &:last-child {
        padding: 0;
    }
`;

const KYCStart = ({ selectedAccount }: WithInvityLayoutProps) => {
    const {
        control,
        errors,
        register,
        onSubmit,
        handleSubmit,
        frontDropzoneState,
        backDropzoneState,
        selfieDropzoneState,
        documentCountryOptions,
        documentTypeOptions,
        defaultDocumentCountry,
        defaultDocumentType,
        isSelfieRequired,
    } = useSavingsKYCStart(selectedAccount);

    const documentCountrySelectName = 'documentCountry';
    const documentTypeSelectName = 'documentType';
    const documentNumberInputName = 'documentNumber';
    const documentImageFrontInputName = 'documentImageFront';
    const documentImageBackInputName = 'documentImageBack';
    const documentImageSelfieInputName = 'documentImageSelfie';

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Header>
                <Translation id="TR_SAVINGS_KYC_START_HEADER" />
            </Header>
            <Row>
                <Controller
                    control={control}
                    name={documentCountrySelectName}
                    defaultValue={defaultDocumentCountry}
                    render={({ onChange, value }) => (
                        <Select
                            label={<Translation id="TR_SAVINGS_KYC_START_DOCUMENT_COUNTRY_LABEL" />}
                            options={documentCountryOptions}
                            isSearchable
                            value={value}
                            formatOptionLabel={(option: CountryOption) => {
                                const labelParts = getCountryLabelParts(option.label);
                                if (!labelParts) return null;

                                return (
                                    <OptionLabel>
                                        <FlagWrapper>
                                            <Flag country={option.value} />
                                        </FlagWrapper>
                                        <LabelText>{labelParts.text}</LabelText>
                                    </OptionLabel>
                                );
                            }}
                            hideTextCursor
                            onChange={onChange}
                        />
                    )}
                />
            </Row>
            <Row>
                <Controller
                    control={control}
                    name={documentTypeSelectName}
                    defaultValue={defaultDocumentType}
                    render={({ onChange, value }) => (
                        <Select
                            value={value}
                            label={<Translation id="TR_SAVINGS_KYC_START_DOCUMENT_TYPE_LABEL" />}
                            options={documentTypeOptions}
                            onChange={onChange}
                            innerRef={register({
                                validate: (value: string) => {
                                    if (!value) {
                                        return (
                                            <Translation id="TR_SAVINGS_KYC_START_DOCUMENT_NUMBER_REQUIRED" />
                                        );
                                    }
                                },
                            })}
                        />
                    )}
                />
            </Row>
            <Row>
                <Input
                    label={<Translation id="TR_SAVINGS_KYC_START_DOCUMENT_NUMBER_LABEL" />}
                    name={documentNumberInputName}
                    state={getInputState(errors[documentNumberInputName])}
                    innerRef={register({
                        validate: (value: string) => {
                            if (!value) {
                                return (
                                    <Translation id="TR_SAVINGS_KYC_START_DOCUMENT_NUMBER_REQUIRED" />
                                );
                            }
                        },
                    })}
                    bottomText={<InputError error={errors[documentNumberInputName]} />}
                />
            </Row>
            <Row>
                <KYCImageDropzone
                    control={control}
                    name={documentImageFrontInputName}
                    dropzoneState={frontDropzoneState}
                    label={<Translation id="TR_SAVINGS_KYC_START_DOCUMENT_DROPZONE_FRONT_LABEL" />}
                    error={errors.documentImageFront}
                    required
                />
            </Row>
            <Row>
                <KYCImageDropzone
                    control={control}
                    name={documentImageBackInputName}
                    dropzoneState={backDropzoneState}
                    label={<Translation id="TR_SAVINGS_KYC_START_DOCUMENT_DROPZONE_BACK_LABEL" />}
                    error={errors.documentImageBack}
                    required
                />
            </Row>
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
