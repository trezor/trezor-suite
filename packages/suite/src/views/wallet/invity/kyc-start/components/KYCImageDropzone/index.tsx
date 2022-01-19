import React from 'react';
import type { DropzoneState } from 'react-dropzone';
import { Control, Controller, FieldError } from 'react-hook-form';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { colors, variables, Icon } from '@trezor/components';

interface DropzoneProps {
    isError: boolean;
}

const DropzoneWrapper = styled.div`
    display: flex;
    flex-flow: column;
    flex-basis: 100%;
`;

const Dropzone = styled.div<DropzoneProps>`
    border: 2px dashed ${props => (props.isError ? props.theme.TYPE_RED : props.theme.STROKE_GREY)};
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
    flex-flow: row;
    align-items: center;
`;

const Grey = styled.div`
    color: ${props => props.theme.TYPE_LIGHTER_GREY};
`;

const DropzoneLabel = styled(DropzoneElement)`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const SelectFromFilesWrapper = styled.span`
    cursor: pointer;
    & span {
        color: ${props => props.theme.TYPE_LIGHTER_GREY};
        text-decoration: underline solid ${props => props.theme.TYPE_LIGHTER_GREY};
    }
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

const FileError = styled.div`
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
    error?: FieldError;
    required?: boolean;
}

const KYCImageDropzone = ({
    control,
    name,
    dropzoneState,
    label,
    error,
    required,
}: KYCImageDropzoneProps) => (
    <Controller
        control={control}
        name={name}
        rules={{ required }}
        defaultValue=""
        render={({ onChange, name }) => {
            const noFileDropped =
                dropzoneState.acceptedFiles.length === 0 &&
                dropzoneState.fileRejections.length === 0;
            const acceptedFile = dropzoneState.acceptedFiles[0];
            const rejectedFile = dropzoneState.fileRejections[0];
            return (
                <DropzoneWrapper>
                    <Dropzone {...dropzoneState.getRootProps()} isError={!!error || !!rejectedFile}>
                        <input {...dropzoneState.getInputProps({ onChange, name })} />
                        <DropzoneLabel>(TODO: Icon) {label}</DropzoneLabel>
                        <DropzoneElement>
                            <Grey>
                                <Translation id="TR_SAVINGS_KYC_START_IMAGE_DROPZONE_VALID_IMAGE_REQUIREMENTS" />
                            </Grey>
                        </DropzoneElement>
                        <DropzoneElement>
                            {noFileDropped && (
                                <Grey>
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
                                </Grey>
                            )}
                            {acceptedFile && (
                                <>
                                    <Icon icon="CHECK" color={colors.TYPE_GREEN} />
                                    <AcceptedFile>{acceptedFile.name}</AcceptedFile>
                                    &nbsp;
                                    <SelectFromFilesWrapper onClick={dropzoneState.open}>
                                        <Translation id="TR_SAVINGS_KYC_START_IMAGE_DROPZONE_REUPLOAD" />
                                    </SelectFromFilesWrapper>
                                </>
                            )}
                            {rejectedFile && (
                                <RejectedFileWrapper>
                                    <CenteredRow>
                                        <Icon icon="CROSS" color={colors.TYPE_RED} />
                                        <RejectedFile>{rejectedFile.file.name}</RejectedFile>
                                        &nbsp;
                                        <SelectFromFilesWrapper onClick={dropzoneState.open}>
                                            <Translation id="TR_SAVINGS_KYC_START_IMAGE_DROPZONE_REUPLOAD" />
                                        </SelectFromFilesWrapper>
                                    </CenteredRow>
                                    {rejectedFile.errors.map(error => (
                                        <FileError key={error.code}>
                                            {/* TODO: Translate error messages based on error.code */}
                                            {error.message}
                                        </FileError>
                                    ))}
                                </RejectedFileWrapper>
                            )}
                        </DropzoneElement>
                        {error && (
                            <DropzoneElement>
                                <FileError>
                                    {error.type === 'required' && (
                                        <Translation id="TR_SAVINGS_KYC_START_IMAGE_DROPZONE_ERROR_REQUIRED" />
                                    )}
                                </FileError>
                            </DropzoneElement>
                        )}
                    </Dropzone>
                </DropzoneWrapper>
            );
        }}
    />
);
export default KYCImageDropzone;
