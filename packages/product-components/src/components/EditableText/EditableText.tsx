import React, { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import styled, { css } from 'styled-components';

import {
    type FrameProps,
    type FramePropsKeys,
    Row,
    Text,
    Tooltip,
    type TransientProps,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '@trezor/components';
import { type SpacingValuesNew, borders, zIndices } from '@trezor/theme';

import { ActionsContainer } from './ActionsContainer';
import { type SavingStatus } from './types';
import {
    SAVED_STATUS_TIMEOUT,
    escapeCssContent,
    extractTextFromNode,
    useShortcuts,
    useTextTruncation,
} from './utils';

export const allowedEditableTextFrameProps = [
    'maxWidth',
    'minHeight',
    'flex',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedEditableTextFrameProps)[number]>;

export type EditableTextProps = AllowedFrameProps & {
    children?: ReactNode;
    onSubmit?: (value: string) => Promise<boolean>;
    onEdit?: () => Promise<any>;
    onCancel?: () => void;
    isLoading?: boolean;
    isDisabled?: boolean;
    isAlwaysActive?: boolean;
    placeholder?: string;
    leftAddon?: ReactNode;
    rightAddon?: ReactNode;
    gap?: SpacingValuesNew;
    'data-testid'?: string;
} & (
        | { defaultValue?: undefined; displayValue?: undefined }
        | { defaultValue: Exclude<ReactNode, undefined>; displayValue?: never }
        | { defaultValue?: never; displayValue: Exclude<ReactNode, undefined> }
    );

const EditableContainer = styled.span<{
    $isEditable: boolean;
    $isEmpty: boolean;
    $placeholder: string | undefined;
    $isDisabled: boolean;
    $hasDisplayValue: boolean;
    $isActive: boolean;
}>`
    overflow: hidden;
    white-space: nowrap;
    transition: color 0.2s ease-in-out;

    ${({ $isActive }) =>
        $isActive &&
        css`
            color: ${({ theme }) => theme.contentPrimary};
        `}

    ${({ $isEditable }) =>
        $isEditable
            ? css`
                  min-width: 0.5em;
                  cursor: text;
              `
            : css`
                  text-overflow: ellipsis;
              `}

    &::-webkit-scrollbar {
        display: none;
    }

    ${({ $isEmpty, $placeholder }) => {
        if (!$isEmpty || !$placeholder) return '';

        const escapedPlaceholder = escapeCssContent($placeholder);

        return css`
            /* Hide the <br> that browsers insert when contentEditable is empty */
            br {
                display: none;
            }

            &::after {
                content: '${escapedPlaceholder}';
                color: ${({ theme }) => theme.contentDisabled};
            }
        `;
    }}

    ${({ $hasDisplayValue }) =>
        $hasDisplayValue &&
        css`
            display: none;
        `}
`;

type ContainerProps = {
    $gap: SpacingValuesNew;
    $isActive: boolean;
    $isAlwaysActive: boolean;
    $isDisabled: boolean;
} & TransientProps<AllowedFrameProps>;

const Container = styled.span<ContainerProps>`
    --padding: calc(0.1em + 2px);

    display: inline-flex;
    align-items: center;
    position: relative;
    max-width: 100%;
    gap: ${({ $gap }) => $gap}px;
    overflow: hidden;
    height: 28px;
    box-sizing: content-box;
    padding: var(--padding);
    padding-left: ${({ $gap }) => $gap}px;
    cursor: ${({ $isDisabled }) => ($isDisabled ? 'inherit' : 'pointer')};

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: ${({ theme }) => theme.elementFillNeutralSofter};
        border-radius: ${borders.radii.xs};
        pointer-events: none;
        opacity: 0;
        transform-origin: left;
        transform: scaleX(0.9);

        ${({ $isActive }) =>
            $isActive &&
            css`
                opacity: 1;
                transform: scaleX(1);
                transition: 0.2s ease-in-out;
            `}
    }

    ${({ $isAlwaysActive, $gap }) =>
        !$isAlwaysActive
            ? css`
                  margin: calc(var(--padding) * -1);
                  margin-left: -${$gap}px;
              `
            : css`
                  &:hover::before {
                      background: ${({ theme }) => theme.elementFillFieldHovered};
                  }
              `}

    ${withFrameProps};
`;

export const EditableText = ({
    children,
    defaultValue,
    displayValue,
    onSubmit,
    onEdit,
    onCancel,
    isLoading = false,
    isDisabled = false,
    isAlwaysActive = false,
    placeholder,
    leftAddon,
    rightAddon,
    gap = 8,
    'data-testid': dataTestId,
    ...rest
}: EditableTextProps) => {
    const [isEditable, setIsEditable] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [savingStatus, setSavingStatus] = useState<SavingStatus>('idle');
    const [defaultValueTextContent, setDefaultValueTextContent] = useState<string>('');
    const [currentValueTextContent, setCurrentValueTextContent] = useState<string>('');
    const containerRef = useRef<HTMLElement>(null);
    const savedValueRef = useRef<string>('');
    const valueRef = useRef<HTMLElement>(null);
    const isTextTruncated = useTextTruncation({ elementRef: valueRef, isEditable });

    const frameProps = pickAndPrepareFrameProps(rest, allowedEditableTextFrameProps);
    const isTooltipActive =
        isTextTruncated &&
        !isEditable &&
        savingStatus === 'idle' &&
        !isLoading &&
        !isDisabled &&
        isHovered;
    const isEmpty = !currentValueTextContent;
    const hasDisplayValue = Boolean(!isEditable && isEmpty && displayValue && !defaultValue);
    const hasCustomValue = Boolean(
        currentValueTextContent && currentValueTextContent !== defaultValueTextContent,
    );
    const isActive = isHovered || isEditable || isAlwaysActive;
    const isDirty = currentValueTextContent !== savedValueRef.current;
    const zIndex = isDisabled ? undefined : zIndices.labeling;

    useEffect(() => {
        const textContent = extractTextFromNode(children);

        savedValueRef.current = textContent;
        setCurrentValueTextContent(textContent);
    }, [children]);

    useEffect(() => {
        setDefaultValueTextContent(extractTextFromNode(defaultValue));
    }, [defaultValue]);

    const focus = (select: boolean = true) => {
        requestAnimationFrame(() => {
            if (valueRef.current) {
                valueRef.current.focus();

                const selection = window.getSelection();
                const range = document.createRange();

                // Move range to the end of the content
                range.selectNodeContents(valueRef.current);

                if (!select) {
                    range.collapse(false);
                }

                selection?.removeAllRanges();
                selection?.addRange(range);
            }
        });
    };

    const removeInputSelection = () => {
        const selection = window.getSelection();
        selection?.removeAllRanges();
    };

    const handleCancel = useCallback(() => {
        setIsEditable(false);
        removeInputSelection();
        setCurrentValueTextContent(savedValueRef.current);

        if (valueRef.current) {
            valueRef.current.textContent = savedValueRef.current;
            valueRef.current.scrollLeft = 0;

            if (isDirty) {
                setIsHovered(false);
            }
        }

        onCancel?.();
    }, [onCancel, isDirty]);

    const handleEdit = useCallback(async () => {
        const result = await onEdit?.();

        // Needed in case onEdit is undefined
        if (result === false) {
            return;
        }

        setIsEditable(true);
        focus();
    }, [onEdit]);

    const handleDelete = useCallback(async () => {
        setSavingStatus('saving');
        setIsEditable(false);
        setIsHovered(false);
        removeInputSelection();

        const result = await onSubmit?.('');

        if (result) {
            setCurrentValueTextContent(defaultValueTextContent);
            setSavingStatus('saved');

            if (valueRef.current) {
                valueRef.current.scrollLeft = 0;
                savedValueRef.current = defaultValueTextContent;
                valueRef.current.textContent = defaultValueTextContent;
            }

            setTimeout(() => {
                setSavingStatus('idle');
            }, SAVED_STATUS_TIMEOUT);
        } else {
            setSavingStatus('error');
        }
    }, [defaultValueTextContent, onSubmit]);

    const handleSave = useCallback(async () => {
        const newValue = valueRef.current?.textContent ?? '';

        if (newValue.trim() === '') {
            await handleDelete();

            return;
        }

        if (valueRef.current) {
            valueRef.current.scrollLeft = 0;

            setSavingStatus('saving');
            setIsEditable(false);
            removeInputSelection();

            const result = await onSubmit?.(newValue);

            if (result) {
                savedValueRef.current = newValue;

                setCurrentValueTextContent(newValue);
                setSavingStatus('saved');

                setTimeout(() => {
                    setSavingStatus('idle');
                }, SAVED_STATUS_TIMEOUT);
            } else {
                setSavingStatus('error');
            }
        }
    }, [handleDelete, onSubmit]);

    const handleError = useCallback(() => {
        setIsEditable(true);
        focus();
        setSavingStatus('idle');
    }, []);

    const handleContainerClick = useCallback(
        (e: React.MouseEvent<HTMLElement>) => {
            e.stopPropagation();

            if (isEditable) {
                return;
            }

            handleEdit();
        },
        [handleEdit, isEditable],
    );

    const handlePaste = (e: React.ClipboardEvent<HTMLElement>) => {
        e.preventDefault();

        const text = e.clipboardData.getData('text/plain');
        const selection = window.getSelection();

        if (selection?.rangeCount && text) {
            const range = selection.getRangeAt(0);

            range.deleteContents();
            range.insertNode(document.createTextNode(text));
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);

            setCurrentValueTextContent(valueRef.current?.textContent || '');
        }
    };

    useEffect(() => {
        if (!isEditable) return;

        const handleOuterClick = (e: MouseEvent) => {
            if (!containerRef?.current?.contains(e.target as Node)) {
                handleCancel();
            }
        };

        document.addEventListener('click', handleOuterClick);

        return () => {
            document.removeEventListener('click', handleOuterClick);
        };
    }, [isEditable, handleCancel]);

    useShortcuts({ isEditable, isDirty, handleSave, handleCancel });

    return (
        <Container
            ref={containerRef}
            data-testid={dataTestId}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={isDisabled ? undefined : handleContainerClick}
            $gap={gap}
            $isActive={isActive && !isDisabled}
            $isAlwaysActive={isAlwaysActive && !isDisabled}
            $isDisabled={isDisabled}
            {...frameProps}
        >
            {leftAddon && (
                <Row position={{ type: 'relative' }} zIndex={zIndex}>
                    {leftAddon}
                </Row>
            )}
            <Tooltip
                // Tooltip must always have non-empty content to prevent from remounting and messing with the editable container!
                content={currentValueTextContent || ' '}
                display="inline-flex"
                as="span"
                maxWidth="100%"
                minWidth={0}
                flex="1"
                delayShow={1000}
                delayHide={0}
                isActive={isTooltipActive}
            >
                <Row
                    alignSelf="baseline"
                    maxWidth="100%"
                    display="inline-flex"
                    overflow="hidden"
                    zIndex={zIndex}
                >
                    <EditableContainer
                        ref={valueRef}
                        contentEditable={isEditable}
                        data-testid="@metadata/input"
                        suppressContentEditableWarning
                        onInput={e => {
                            setCurrentValueTextContent(e.currentTarget.textContent || '');
                        }}
                        onPaste={handlePaste}
                        $placeholder={placeholder}
                        $isEmpty={isEmpty}
                        $isEditable={isEditable}
                        $isDisabled={isDisabled}
                        $isActive={isActive}
                        $hasDisplayValue={hasDisplayValue}
                        autoCapitalize="off"
                        spellCheck={false}
                        autoCorrect="off"
                    >
                        {children}
                    </EditableContainer>
                    {hasDisplayValue && (
                        <Text
                            ellipsisLineCount={1}
                            as="div"
                            pointerEvents="none"
                            color={isActive ? 'contentPrimary' : undefined}
                        >
                            {displayValue}
                        </Text>
                    )}
                </Row>
            </Tooltip>
            {rightAddon && (
                <Row position={{ type: 'relative' }} zIndex={zIndex}>
                    {rightAddon}
                </Row>
            )}
            <ActionsContainer
                onEdit={handleEdit}
                onDelete={handleDelete}
                onError={handleError}
                onSubmit={handleSave}
                onCancel={handleCancel}
                isLoading={isLoading}
                isEditable={isEditable}
                savingStatus={savingStatus}
                isDisabled={isDisabled}
                isHovered={isHovered || isAlwaysActive}
                isSubmitButtonVisible={isDirty}
                isDeleteButtonVisible={hasCustomValue}
            />
        </Container>
    );
};
