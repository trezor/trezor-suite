import React, { ReactNode, useEffect } from 'react';

import styled, { css } from 'styled-components';

import {
    FrameProps,
    FramePropsKeys,
    TransientProps,
    pickAndPrepareFrameProps,
    useElevation,
    withFrameProps,
} from '@trezor/components';
import { Elevation, borders, mapElevationToBorder, nextElevation } from '@trezor/theme';

import { ActionsContainer } from './ActionsContainer';
import { useOuterClick, useShortcuts } from './utils';

export const allowedEditableTextFrameProps = [
    'margin',
    'maxWidth',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedEditableTextFrameProps)[number]>;

export type EditableTextProps = {
    children: React.ReactNode;
    onSave: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    isLoading?: boolean;
    isDisabled?: boolean;
    isDeleteButtonVisible?: boolean;
} & AllowedFrameProps;

const BORDER_SIZE = 6;

const EditableContainer = styled.span<TransientProps<AllowedFrameProps>>`
    white-space: nowrap;
    overflow: auto;
    display: inline-flex;

    ${withFrameProps}

    &::-webkit-scrollbar {
        display: none;
    }
`;

const Container = styled.span<{ $elevation: Elevation; $isEditable: boolean }>`
    position: relative;

    ${({ $isEditable, $elevation, theme }) =>
        $isEditable &&
        css`
            cursor: ${$isEditable ? 'text' : 'inherit'};

            &::before {
                content: '';
                position: absolute;
                inset: -${BORDER_SIZE}px;
                border: solid ${borders.widths.large} ${mapElevationToBorder({ theme, $elevation })};
                cursor: text;
                border-radius: ${borders.radii.xs};
                pointer-events: none;
            }
        `}
`;

export const EditableText = ({
    children,
    onSave,
    onFocus,
    onBlur,
    isLoading,
    isDisabled,
    isDeleteButtonVisible = false,
    ...rest
}: EditableTextProps) => {
    const [isEditable, setIsEditable] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const [isJustSaved, setIsJustSaved] = React.useState(false);
    const [originalValue, setOriginalValue] = React.useState<ReactNode | string>(null);
    const { elevation } = useElevation();
    const frameProps = pickAndPrepareFrameProps(rest, allowedEditableTextFrameProps);

    const valueRef = React.useRef<HTMLSpanElement>(null);
    useEffect(() => {
        setOriginalValue(children || '');
    }, [children]);

    const selectInputText = () => {
        if (valueRef.current) {
            valueRef.current.focus();
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(valueRef.current);
            selection?.removeAllRanges();
            selection?.addRange(range);
        }
    };

    const removeInputSelection = () => {
        const selection = window.getSelection();
        selection?.removeAllRanges();
    };

    const handleEdit = () => {
        setIsEditable(!isEditable);
        setTimeout(() => {
            valueRef.current?.focus();
            selectInputText();
        }, 0);
    };

    const handleDelete = () => {
        onSave('');
        setOriginalValue('');

        if (valueRef.current) {
            valueRef.current.textContent = '';
        }
    };

    const handleSave = () => {
        setIsJustSaved(true);
        setIsEditable(false);
        removeInputSelection();

        setTimeout(() => {
            setIsJustSaved(false);
        }, 2000);

        if (valueRef.current?.textContent) {
            setOriginalValue(valueRef.current.textContent);
            onSave(valueRef.current.textContent);
        }
    };

    const handleCancel = () => {
        setIsEditable(false);
        setIsHovered(false);
        if (valueRef.current) {
            valueRef.current.textContent = typeof originalValue === 'string' ? originalValue : '';
        }
        removeInputSelection();
    };
    useShortcuts({ isEditable, handleSave, handleCancel });

    const innerRef = useOuterClick(() => {
        if (isEditable) {
            handleSave();
        }
    });

    return (
        <Container
            ref={innerRef}
            $elevation={nextElevation[elevation]}
            $isEditable={isEditable}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={
                isEditable
                    ? e => {
                          e.stopPropagation();
                      }
                    : undefined
            }
        >
            <EditableContainer
                ref={valueRef}
                contentEditable={isEditable}
                onFocus={onFocus}
                onBlur={onBlur}
                {...frameProps}
            >
                {children}
            </EditableContainer>
            <ActionsContainer
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSave={handleSave}
                onCancel={handleCancel}
                isLoading={isLoading}
                isEditable={isEditable}
                isJustSaved={isJustSaved}
                isDisabled={isDisabled}
                isHovered={isHovered}
                isDeleteButtonVisible={isDeleteButtonVisible}
            />
        </Container>
    );
};
