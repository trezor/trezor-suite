import React from 'react';
import { Button, Flag, Input, Select, variables } from '@trezor/components';
import { useSavingsKYCStart } from '@wallet-hooks/coinmarket/savings/useSavingsKYCStart';
import { WithCoinmarketLoadedProps, withCoinmarketSavingsLoaded } from '@wallet-components/hocs';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { Controller } from 'react-hook-form';
import type { CountryOption } from '@wallet-types/coinmarketCommonTypes';
import { getCountryLabelParts } from '@wallet-utils/coinmarket/coinmarketUtils';
import KYCImageDropzone from './components/KYCImageDropzone';
import { InputError } from '@wallet-components';
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

type KYCStartProps = WithCoinmarketLoadedProps;

const KYCStart = ({ selectedAccount }: KYCStartProps) => {
    const {
        control,
        errors,
        register,
        onSubmit,
        handleSubmit,
        frontDropzoneState,
        backDropzoneState,
        documentCountryOptions,
        documentTypeOptions,
        defaultDocumentCountry,
        defaultDocumentType,
    } = useSavingsKYCStart(selectedAccount);

    const documentCountrySelectName = 'documentCountry';
    const documentTypeSelectName = 'documentType';
    const documentNumberInputName = 'documentNumber';
    const documentImageFrontInputName = 'documentImageFront';
    const documentImageBackInputName = 'documentImageBack';

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
                    label={<Translation id="TR_SAVINGS_KYC_START_DOCUMENT_FRONT_LABEL" />}
                />
            </Row>
            <Row>
                <KYCImageDropzone
                    control={control}
                    name={documentImageBackInputName}
                    dropzoneState={backDropzoneState}
                    label={<Translation id="TR_SAVINGS_KYC_START_DOCUMENT_BACK_LABEL" />}
                />
            </Row>
            <Button>
                <Translation id="TR_SAVINGS_KYC_START_CONFIRM" />
            </Button>
        </form>
    );
};

export default withCoinmarketSavingsLoaded(KYCStart);
