import React, { useRef, useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { P, Icon } from '@trezor/components';
import { Translation } from '@suite-components';
import { IconType } from '@trezor/components/src/support/types';

interface Props {
    // 'accept' attribute for underlying HTML file input
    accept?: string;
    // icon displayed inside Dropzone
    icon?: IconType;
    // function which is called after the file is selected
    onSelect: (data: File, setError: (msg: string) => void) => void;
    className?: string;
}

export const useDropZone = ({ accept, onSelect, className }: Props) => {
    const available = useRef(window.File && window.FileReader && window.FileList && window.Blob);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [error, setError] = useState<string | undefined>(undefined);
    const [filename, setFilename] = useState<string>();

    const readFileContent = useCallback(
        (file?: File) => {
            if (!file) {
                setFilename(undefined);
                setError('empty');
                return;
            }
            setError(undefined);
            setFilename(file.name);
            onSelect(file, setError);
        },
        [onSelect],
    );

    const onClick = useCallback(() => {
        if (inputRef.current) {
            inputRef.current.value = '';
            inputRef.current.click();
        }
    }, [inputRef]);

    const prevent = useCallback(event => {
        event.preventDefault();
    }, []);

    const onDragEnter = useCallback(event => {
        event.preventDefault();
        event.currentTarget?.classList?.add('dragging');
    }, []);

    const onDragLeave = useCallback(event => {
        event.preventDefault();
        event.currentTarget?.classList?.remove('dragging');
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            event.currentTarget?.classList?.remove('dragging');
            if (event.dataTransfer) {
                readFileContent(event.dataTransfer.files[0]);
            } else {
                setError('empty');
            }
        },
        [readFileContent],
    );

    const onInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.stopPropagation();
            if (event.target?.value && event.target.files) {
                readFileContent(event.target.files[0]);
            } else {
                setError('empty');
            }
        },
        [readFileContent],
    );

    const onInputClick = useCallback(event => {
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
            className,
        }),
        [onClick, prevent, onDrop, className, onDragEnter, onDragLeave],
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

const Wrapper = styled.div`
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border: 2px dashed ${props => props.theme.STROKE_GREY};
    border-radius: 6px;
    cursor: pointer;
    min-height: 300px;
    transition: background-color 0.3s;
    &:hover,
    &.dragging {
        background: ${props => props.theme.BG_GREY};
    }
    * {
        pointer-events: none;
    }
`;

const StyledInput = styled.input`
    display: none;
`;

const StyledIcon = styled(Icon)`
    margin-right: 8px;
`;

const Label = styled.div`
    display: flex;
    align-items: center;
`;

export const DropZone = (props: Props) => {
    const { getWrapperProps, getInputProps, error, filename } = useDropZone(props);

    return (
        <Wrapper {...getWrapperProps()}>
            <StyledInput {...getInputProps()} />
            <Label>
                <StyledIcon icon={props.icon || 'BINARY'} />
                {filename || <Translation id="TR_DROPZONE" />}
            </Label>
            {error && (
                <P>
                    <Translation id="TR_DROPZONE_ERROR" values={{ error }} />
                </P>
            )}
        </Wrapper>
    );
};
