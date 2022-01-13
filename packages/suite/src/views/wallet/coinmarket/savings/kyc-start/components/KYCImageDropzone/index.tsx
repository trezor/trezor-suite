import React from 'react';
import type { DropzoneState } from 'react-dropzone';
import { Control, Controller } from 'react-hook-form';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { colors, variables, Icon } from '@trezor/components';

const DropzoneWrapper = styled.div`
    display: flex;
    flex-flow: column;
    flex-basis: 100%;
`;

const Dropzone = styled.div`
    border: 2px dashed ${props => props.theme.STROKE_GREY};
    box-sizing: border-box;
    border-radius: 6px;
    padding: 16px;
    display: flex;
    flex-wrap: wrap;
    width: 100%;
`;

const DropzoneElement = styled.div`
    width: 100%;
    display: flex;
    justify-content: center;
`;

const DropzoneLabel = styled(DropzoneElement)`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const SelectFromFilesWrapper = styled.u`
    cursor: pointer;
`;

const AcceptedFile = styled.div`
    display: flex;
    color: ${colors.TYPE_GREEN};
`;

const RejectedFile = styled.div`
    display: flex;
    color: ${colors.TYPE_RED};
`;

const RejectedFileWrapper = styled.div`
    display: flex;
    flex-flow: column;
`;

const RejectedFileError = styled.div`
    color: ${colors.TYPE_RED};
`;

const CenteredRow = styled.div`
    display: flex;
    flex-flow: row;
    justify-content: center;
    align-items: center;
    height: 24px;
`;

interface KYCImageDropzoneProps {
    control: Control;
    name: string;
    label: string | React.ReactElement;
    dropzoneState: DropzoneState;
}

const KYCImageDropzone = ({ control, name, dropzoneState, label }: KYCImageDropzoneProps) => (
    <Controller
        control={control}
        name={name}
        rules={{ required: true }}
        defaultValue=""
        render={({ onChange, name }) => {
            const noFileDropped =
                dropzoneState.acceptedFiles.length === 0 &&
                dropzoneState.fileRejections.length === 0;
            const acceptedFile = dropzoneState.acceptedFiles[0];
            const rejectedFile = dropzoneState.fileRejections[0];
            return (
                <DropzoneWrapper>
                    <Dropzone {...dropzoneState.getRootProps()}>
                        <input {...dropzoneState.getInputProps({ onChange, name })} />
                        <DropzoneLabel>(TODO: Icon) {label}</DropzoneLabel>
                        <DropzoneElement>
                            {noFileDropped && (
                                <CenteredRow>
                                    <Translation
                                        id="TR_SAVINGS_KYC_START_IMAGE_DROPZONE_DESCRIPTION"
                                        values={{
                                            selectFromFiles: (
                                                <SelectFromFilesWrapper
                                                    onClick={dropzoneState.open}
                                                >
                                                    <Translation id="TR_SAVINGS_KYC_START_IMAGE_DROPZONE_DESCRIPTION_SELECT_FROM_FILES" />
                                                </SelectFromFilesWrapper>
                                            ),
                                        }}
                                    />
                                </CenteredRow>
                            )}
                            {acceptedFile && (
                                <CenteredRow>
                                    <Icon icon="CHECK" color={colors.TYPE_GREEN} />
                                    <AcceptedFile>{acceptedFile.name}</AcceptedFile>
                                    &nbsp;
                                    <SelectFromFilesWrapper onClick={dropzoneState.open}>
                                        <Translation id="TR_SAVINGS_KYC_START_IMAGE_DROPZONE_REUPLOAD" />
                                    </SelectFromFilesWrapper>
                                </CenteredRow>
                            )}
                            {rejectedFile && (
                                <RejectedFileWrapper>
                                    <CenteredRow>
                                        <Icon icon="CROSS" color={colors.TYPE_RED} />
                                        <RejectedFile>{rejectedFile.file.name}</RejectedFile>&nbsp;
                                        <SelectFromFilesWrapper onClick={dropzoneState.open}>
                                            <Translation id="TR_SAVINGS_KYC_START_IMAGE_DROPZONE_REUPLOAD" />
                                        </SelectFromFilesWrapper>
                                    </CenteredRow>

                                    {rejectedFile.errors.map(error => (
                                        <RejectedFileError key={error.code}>
                                            {/* TODO: Translate error messages based on error.code */}
                                            {error.message}
                                        </RejectedFileError>
                                    ))}
                                </RejectedFileWrapper>
                            )}
                        </DropzoneElement>
                    </Dropzone>
                </DropzoneWrapper>
            );
        }}
    />
);
export default KYCImageDropzone;
