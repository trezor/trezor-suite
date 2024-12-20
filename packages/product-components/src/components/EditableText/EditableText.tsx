import React, { ReactNode, useEffect } from 'react';

import styled, { css } from 'styled-components';

import { borders, Elevation, mapElevationToBorder, nextElevation, spacings } from '@trezor/theme';
import { Row, useElevation, Box, Badge, IconButton, Tooltip } from '@trezor/components';

type MaxWidth = number | string;

export type EditableTextProps = {
    children: React.ReactNode;
    maxWidth?: MaxWidth;
    onSave: (value: string) => void;
};

const BORDER_SIZE = 6;

const EditableContainer = styled.span<{ $maxWidth?: MaxWidth }>`
    white-space: nowrap;
    overflow: auto;
    display: inline-flex;

    ${({ $maxWidth }) =>
        $maxWidth &&
        css`
            max-width: ${$maxWidth};
        `}
`;

const ActionsContainer = styled.span`
    position: absolute;
    left: 100%;
    height: 100%;
    top: 0;
    display: flex;
    align-items: center;
    cursor: pointer;
`;

const Container = styled.span<{ $elevation: Elevation; $isEditable: boolean }>`
    position: relative;

    ${({ $isEditable, $elevation, theme }) =>
        $isEditable &&
        css`
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

export const EditableText = ({ children, maxWidth, onSave }: EditableTextProps) => {
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
        >
            <EditableContainer
                ref={valueRef}
                contentEditable={isEditable}
                onFocus={handleFocus}
                $maxWidth={maxWidth}
                onInput={e => {
                    // console.log('___aaa', e.target.textContent);
                    // add to state
                }}
            >
                {children}
            </EditableContainer>
            <ActionsContainer>
                {!isJustSaved && isEditable && (
                    <Row gap={spacings.xxs} margin={{ left: spacings.sm }}>
                        <Tooltip content="Save" hasArrow delayShow={1000} cursor="inherit">
                            <IconButton icon="check" size="tiny" onClick={handleSave} />
                        </Tooltip>
                        <Tooltip content="Cancel" hasArrow delayShow={1000} cursor="inherit">
                            <IconButton
                                variant="destructive"
                                icon="x"
                                size="tiny"
                                onClick={handleCancel}
                            />
                        </Tooltip>
                        {/*<Icon name="check" size="medium" onClick={handleSave} />*/}
                        {/*<Icon name="x" size="medium" onClick={handleCancel} />*/}
                    </Row>
                )}
                {!isJustSaved && !isEditable && isHovered && (
                    <Box margin={{ left: spacings.sm }}>
                        <IconButton icon="pencil" size="tiny" onClick={handleEdit} />
                        {/*<Icon name="pencil" size="medium" onClick={handleEdit} />*/}
                    </Box>
                )}
                {isJustSaved && (
                    <Row gap={spacings.xxs} margin={{ left: spacings.sm }}>
                        <Badge icon="check" variant="primary">
                            Saved
                        </Badge>
                    </Row>
                )}
            </ActionsContainer>
        </Container>
    );
};
