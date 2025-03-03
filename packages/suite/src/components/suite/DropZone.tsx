import { ChangeEvent, DragEvent, MouseEvent, useCallback, useMemo, useRef, useState } from 'react';

import styled from 'styled-components';

import { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import { Column, Icon, IconName, Paragraph, Row, useElevation } from '@trezor/components';
import { Elevation, borders, mapElevationToBorder, spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';

type DropZoneProps = {
    accept?: string;
    iconName?: IconName;
    onSelect: (data: File, setError: (msg: ExtendedMessageDescriptor) => void) => void;
    'data-testid'?: string;
};

export const useDropZone = ({ accept, onSelect }: DropZoneProps) => {
    const available = useRef(window.File && window.FileReader && window.FileList && window.Blob);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [error, setError] = useState<ExtendedMessageDescriptor>();
    const [filename, setFilename] = useState<string>();

    const allowedExtensions = useMemo(
        () =>
            (accept || '')
                .split(',')
                .map(s => s.trim())
                .filter(s => s.startsWith('.'))
                .map(ext => ext.slice(1).toLowerCase()),
        [accept],
    );

    const readFileContent = useCallback(
        (file?: File) => {
            setFilename(file?.name);
            if (!file) {
                setError({ id: 'TR_DROPZONE_ERROR_EMPTY' });

                return;
            }
            if (allowedExtensions.length) {
                const extRegex = new RegExp(`\\.(${allowedExtensions.join('|')})$`, 'i');
                if (!extRegex.test(file.name)) {
                    setError({ id: 'TR_DROPZONE_ERROR_FILETYPE' });

                    return;
                }
            }
            setError(undefined);
            onSelect(file, setError);
        },
        [onSelect, allowedExtensions],
    );

    const onClick = useCallback(() => {
        if (inputRef.current) {
            inputRef.current.value = '';
            inputRef.current.click();
        }
    }, [inputRef]);

    const prevent = useCallback((event: MouseEvent) => {
        event.preventDefault();
    }, []);

    const onDragEnter = useCallback((event: MouseEvent) => {
        event.preventDefault();
        event.currentTarget?.classList?.add('dragging');
    }, []);

    const onDragLeave = useCallback((event: MouseEvent) => {
        event.preventDefault();
        event.currentTarget?.classList?.remove('dragging');
    }, []);

    const onDrop = useCallback(
        (event: DragEvent) => {
            event.preventDefault();
            event.currentTarget?.classList?.remove('dragging');
            if (event.dataTransfer) {
                readFileContent(event.dataTransfer.files[0]);
            } else {
                setError({ id: 'TR_DROPZONE_ERROR_EMPTY' });
            }
        },
        [readFileContent],
    );

    const onInputChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            event.stopPropagation();
            if (event.target?.value && event.target.files) {
                readFileContent(event.target.files[0]);
            } else {
                setError({ id: 'TR_DROPZONE_ERROR_EMPTY' });
            }
        },
        [readFileContent],
    );

    const onInputClick = useCallback((event: MouseEvent) => {
        event.stopPropagation();
    }, []);

    const getWrapperProps = useMemo(
        () => () => ({
            onClick,
            onDragEnter,
            onDragOver: prevent,
            onDragLeave,
            onDrop,
            ref: wrapperRef,
        }),
        [onClick, prevent, onDrop, onDragEnter, onDragLeave],
    );

    const getInputProps = useMemo(
        () => () => ({
            type: 'file',
            multiple: false,
            accept,
            autoComplete: 'off',
            tabIndex: -1,
            onChange: onInputChange,
            onClick: onInputClick,
            ref: inputRef,
        }),
        [accept, onInputChange, onInputClick],
    );

    return {
        available: available.current,
        error,
        filename,
        getWrapperProps,
        getInputProps,
    };
};

const Wrapper = styled.div<{ $elevation: Elevation }>`
    border: ${borders.widths.large} dashed ${mapElevationToBorder};
    border-radius: ${borders.radii.xs};
    cursor: pointer;
    transition: background-color 0.3s;

    &:hover,
    &.dragging {
        background: ${mapElevationToBorder};
    }

    * {
        pointer-events: none;
    }
`;

const StyledInput = styled.input`
    display: none;
`;

export const DropZone = ({
    accept,
    iconName = 'binary',
    onSelect,
    'data-testid': dataTestId,
}: DropZoneProps) => {
    const { getWrapperProps, getInputProps, error, filename } = useDropZone({ accept, onSelect });
    const { elevation } = useElevation();

    return (
        <Wrapper {...getWrapperProps()} $elevation={elevation} data-testid={dataTestId}>
            <Column
                padding={spacings.lg}
                minHeight={150}
                justifyContent="center"
                alignItems="center"
                gap={spacings.xs}
            >
                <StyledInput {...getInputProps()} />
                <Row gap={spacings.xs}>
                    <Icon name={iconName} />
                    {filename || <Translation id="TR_DROPZONE" />}
                </Row>
                {error && (
                    <Paragraph>
                        <Translation {...error} />
                    </Paragraph>
                )}
            </Column>
        </Wrapper>
    );
};
