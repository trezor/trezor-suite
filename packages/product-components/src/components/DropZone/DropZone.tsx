import {
    type ChangeEvent,
    type DragEvent,
    type MouseEvent,
    type ReactNode,
    useCallback,
    useRef,
    useState,
} from 'react';

import styled from 'styled-components';

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

export type DropZoneProps = {
    accept?: string;
    iconName?: IconName;
    emptyLabel: ReactNode;
    emptyError: ReactNode;
    fileTypeError: ReactNode;
    onSelect: (data: File, setError: (msg: ReactNode) => void) => void;
    'data-testid'?: string;
};

const useDropZone = ({ accept, emptyError, fileTypeError, onSelect }: DropZoneProps) => {
    const available = useRef(
        typeof window !== 'undefined' &&
            Boolean(window.File && window.FileReader && window.FileList && window.Blob),
    );
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [error, setError] = useState<ReactNode>();
    const [filename, setFilename] = useState<string>();

    const allowedExtensions = (accept || '')
        .split(',')
        .map(part => part.trim())
        .filter(part => part.startsWith('.'))
        .map(extension => extension.slice(1).toLowerCase());

    const readFileContent = useCallback(
        (file?: File) => {
            setFilename(file?.name);
            if (!file) {
                setError(emptyError);

                return;
            }
            if (allowedExtensions.length) {
                const extRegex = new RegExp(`\\.(${allowedExtensions.join('|')})$`, 'i');
                if (!extRegex.test(file.name)) {
                    setError(fileTypeError);

                    return;
                }
            }
            setError(undefined);
            onSelect(file, setError);
        },
        [allowedExtensions, emptyError, fileTypeError, onSelect],
    );

    const onClick = useCallback(() => {
        if (inputRef.current) {
            inputRef.current.value = '';
            inputRef.current.click();
        }
    }, []);

    const prevent = useCallback((event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    }, []);

    const onDragEnter = useCallback((event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.currentTarget.classList.add('dragging');
    }, []);

    const onDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.currentTarget.classList.remove('dragging');
    }, []);

    const onDrop = useCallback(
        (event: DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            event.currentTarget.classList.remove('dragging');
            if (event.dataTransfer) {
                readFileContent(event.dataTransfer.files[0]);
            } else {
                setError(emptyError);
            }
        },
        [emptyError, readFileContent],
    );

    const onInputChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            event.stopPropagation();
            if (event.target.value && event.target.files) {
                readFileContent(event.target.files[0]);
            } else {
                setError(emptyError);
            }
        },
        [emptyError, readFileContent],
    );

    const onInputClick = useCallback((event: MouseEvent<HTMLInputElement>) => {
        event.stopPropagation();
    }, []);

    const getWrapperProps = useCallback(
        () => ({
            onClick,
            onDragEnter,
            onDragOver: prevent,
            onDragLeave,
            onDrop,
            ref: wrapperRef,
        }),
        [onClick, onDragEnter, onDragLeave, onDrop, prevent],
    );

    const getInputProps = useCallback(
        () => ({
            type: 'file' as const,
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

export const DropZone = ({
    accept,
    iconName = 'fileX',
    emptyLabel,
    emptyError,
    fileTypeError,
    onSelect,
    'data-testid': dataTestId,
}: DropZoneProps) => {
    const { getWrapperProps, getInputProps, error, filename } = useDropZone({
        accept,
        emptyError,
        fileTypeError,
        emptyLabel,
        onSelect,
        'data-testid': dataTestId,
    });
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
                        {filename ?? emptyLabel}
                    </Text>
                </Row>
                {error !== undefined && (
                    <Paragraph typographyStyle="body-sm" intent="critical">
                        {error}
                    </Paragraph>
                )}
            </Column>
        </Wrapper>
    );
};
