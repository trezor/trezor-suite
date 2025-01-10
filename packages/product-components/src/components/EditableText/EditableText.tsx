import React, { ReactNode, useEffect } from 'react';

import styled, { css } from 'styled-components';

import {
    borders,
    Elevation,
    mapElevationToBorder,
    nextElevation,
    palette,
    spacings,
    zIndices,
} from '@trezor/theme';
import { Row, useElevation, Badge, IconButton, Tooltip, Spinner } from '@trezor/components';

type MaxWidth = number | string;

export type EditableTextProps = {
    children: React.ReactNode;
    maxWidth?: MaxWidth;
    onSave: (value: string) => void;
    isLoading?: boolean;
    isDisabled?: boolean;
    textLoading: string; // TODO not obligatory
};

const BORDER_SIZE = 6;

const EditableContainer = styled.span<{ $maxWidth?: MaxWidth }>`
    white-space: nowrap;
    overflow: auto;
    display: inline-flex;

    &::-webkit-scrollbar {
        display: none;
    }

    ${({ $maxWidth }) =>
        $maxWidth &&
        css`
            max-width: ${typeof $maxWidth === 'number' ? `${$maxWidth}px` : $maxWidth};
        `}
`;

const ActionsBackground = styled.div<{ $elevation: Elevation }>`
    //background: ${palette.darkGray300};
    background: ${({ theme }) => mapElevationToBorder({ theme, $elevation: 2 })};
    border-radius: ${borders.radii.full};
    padding: 4px;
    margin-left: 10px;
`;
const ActionsContainer = styled.span`
    position: absolute;
    left: 100%;
    height: 100%;
    top: 0;
    z-index: ${zIndices.tooltip};
    display: flex;
    align-items: center;
    cursor: pointer;
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
                top: -${BORDER_SIZE}px;
                left: -${BORDER_SIZE}px;
                width: calc(100% + ${2 * BORDER_SIZE}px);
                height: calc(100% + ${2 * BORDER_SIZE}px);
                border: solid ${borders.widths.large} ${mapElevationToBorder({ theme, $elevation })};
                cursor: text;
                border-radius: ${borders.radii.xs};
                pointer-events: none;
            }
        `}
`;

type ShortcutsProps = {
    isEditable: boolean;
    handleSave: () => void;
    handleCancel: () => void;
};

const useShortcuts = ({ isEditable, handleSave, handleCancel }: ShortcutsProps) => {
    useEffect(() => {
        const downHandler = (e: KeyboardEvent) => {
            if (isEditable) {
                if (e.key === 'Enter' || e.key === 'Escape') {
                    e.preventDefault();
                    if (e.key === 'Enter') {
                        handleSave();
                    } else {
                        handleCancel();
                    }
                }
            }
        };

        window.addEventListener('keydown', downHandler);

        return () => {
            window.removeEventListener('keydown', downHandler);
        };
    }, [handleCancel, handleSave, isEditable]);
};
// TODO při focus out ukládat
// trim
export const EditableText = ({
    children,
    maxWidth,
    onSave,
    isLoading,
    textLoading,
    isDisabled,
}: EditableTextProps) => {
    const [isEditable, setIsEditable] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const [isJustSaved, setIsJustSaved] = React.useState(false);
    const [originValue, setOriginValue] = React.useState<ReactNode>(null);
    const { elevation } = useElevation();

    const valueRef = React.useRef<HTMLSpanElement>(null);
    useEffect(() => {
        setOriginValue(children || '');
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
        onSave('abc');
        setOriginValue('abc');

        // is this neccesary?
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

        if (valueRef.current) {
            setOriginValue(valueRef.current.textContent);
            onSave(valueRef.current.textContent);
        }
    };

    const handleCancel = () => {
        setIsEditable(false);
        setIsHovered(false);
        if (valueRef.current) {
            valueRef.current.textContent = typeof originValue === 'string' ? originValue : '';
        }
        removeInputSelection();
    };
    useShortcuts({ isEditable, handleSave, handleCancel });

    const handleFocus = e => {
        // e.target.select();
    };

    return (
        <Container
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
                onFocus={handleFocus}
                $maxWidth={maxWidth}
                // onInput={e => {
                //     console.log('___aaa', e.target.textContent);
                //     add to state
                // }}
            >
                {children}
            </EditableContainer>
            <ActionsContainer>
                {isLoading ? (
                    <ActionsBackground $elevation={elevation}>
                        <Row gap={spacings.xxs}>
                            <Spinner size={20} />
                            {textLoading}
                        </Row>
                    </ActionsBackground>
                ) : (
                    <>
                        {!isJustSaved && isEditable && (
                            <ActionsBackground $elevation={elevation}>
                                <Row gap={spacings.xxs}>
                                    <Tooltip
                                        content="Save"
                                        hasArrow
                                        delayShow={1000}
                                        cursor="inherit"
                                    >
                                        <IconButton
                                            icon="check"
                                            size="tiny"
                                            onClick={handleSave}
                                            isDisabled={isDisabled}
                                        />
                                    </Tooltip>
                                    <Tooltip
                                        content="Cancel"
                                        hasArrow
                                        delayShow={1000}
                                        cursor="inherit"
                                    >
                                        <IconButton
                                            variant="destructive"
                                            icon="x"
                                            size="tiny"
                                            onClick={handleCancel}
                                            isDisabled={isDisabled}
                                        />
                                    </Tooltip>
                                </Row>
                            </ActionsBackground>
                        )}
                        {!isJustSaved && !isEditable && isHovered && (
                            <Row gap={spacings.xxs} margin={{ left: spacings.sm }}>
                                <IconButton
                                    variant="tertiary"
                                    icon="pencil"
                                    size="tiny"
                                    onClick={handleEdit}
                                    isDisabled={isDisabled}
                                />
                                {children && (
                                    <IconButton
                                        variant="tertiary"
                                        icon="x"
                                        size="tiny"
                                        onClick={handleDelete}
                                        isDisabled={isDisabled}
                                    />
                                )}
                            </Row>
                        )}
                        {isJustSaved && (
                            <Row gap={spacings.xxs} margin={{ left: spacings.sm }}>
                                <Badge icon="check" variant="primary">
                                    Saved
                                </Badge>
                            </Row>
                        )}
                    </>
                )}
            </ActionsContainer>
        </Container>
    );
};
