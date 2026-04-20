import {
    type ChangeEvent,
    type DragEvent,
    type MouseEvent,
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react';

import styled from 'styled-components';

import { type ExtendedMessageDescriptor, Translation } from '@suite/intl';
import {
    Column,
    Icon,
    type IconName,
    Paragraph,
    Row,
    Text,
    useElevation,
} from '@trezor/components';
import {
    type Elevation,
    borders,
    mapElevationToBackground,
    mapElevationToBorder,
    spacings,
} from '@trezor/theme';

type DropZoneProps = {
    accept?: string;
    iconName?: IconName;
    onSelect: (data: File, setError: (msg: ExtendedMessageDescriptor) => void) => void;
    'data-testid'?: string;
};

const useDropZone = ({ accept, onSelect }: DropZoneProps) => {
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
        [allowedExtensions, onSelect],
    );

    const onClick = useCallback(() => {
        if (inputRef.current) {
            inputRef.current.value = '';
            inputRef.current.click();
        }
    }, []);

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
            if (event.target.value && event.target.files) {
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
        [onClick, onDragEnter, onDragLeave, onDrop, prevent],
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
    border-radius: ${borders.radii.xs};
    background: ${mapElevationToBackground};
    cursor: pointer;

    &:hover,
    &.dragging {
        outline: ${borders.widths.large} solid ${mapElevationToBorder};
        outline-offset: -${borders.widths.large};
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
    iconName = 'fileX',
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
                    <Icon
                        name={iconName}
                        size={20}
                        {...(filename
                            ? { intent: 'neutral' as const }
                            : { intent: 'neutral' as const, priority: 'secondary' as const })}
                    />
                    <Text
                        typographyStyle="body-sm"
                        intent="neutral"
                        priority={filename ? 'primary' : 'secondary'}
                    >
                        {filename || <Translation id="TR_DROPZONE" />}
                    </Text>
                </Row>
                {error && (
                    <Paragraph typographyStyle="body-sm" intent="critical">
                        <Translation {...error} />
                    </Paragraph>
                )}
            </Column>
        </Wrapper>
    );
};
