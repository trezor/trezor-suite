import React, { useEffect, useCallback, createRef } from 'react';
import styled from 'styled-components';
import { Icon, colors } from '@trezor/components';

import { moveCaretToEndOfContentEditable } from '@suite-utils/dom';

const IconWrapper = styled.div<{ bgColor: string }>`
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${props => props.bgColor};
    border-radius: 4px;
    margin: 0 3px;
    padding: 4px;
`;

interface Props {
    originalValue?: string;
    onSubmit: (value: string | undefined | null) => void;
    onBlur: () => void;
    divRef: React.RefObject<HTMLDivElement>;
}

/**
 * Takes component in parameter and wraps it with content-editable necessities. Renders contenteditable div as it's child
 * and control buttons (submit, cancel).
 */
export const withEditable = (WrappedComponent: React.FC) => ({
    divRef,
    onSubmit,
    onBlur,
    ...props
}: Props) => {
    const wrapperRef = createRef();
    const submit = useCallback(
        value => {
            if (props.originalValue && value === props.originalValue) {
                return onBlur();
            }
            onSubmit(value);
            onBlur();
        },
        [props, onSubmit, onBlur],
    );

    useEffect(() => {
        // Set value of content editable element; set caret to correct position;
        if (divRef?.current) {
            divRef.current.textContent = props.originalValue || null;
            divRef.current.focus();
            moveCaretToEndOfContentEditable(divRef.current);
        }
    }, [props, divRef]);

    useEffect(() => {
        const keyboardHandler = (event: KeyboardEvent) => {
            event.stopPropagation();

            switch (event.keyCode) {
                // tab
                case 9:
                    event.preventDefault();
                    break;
                // enter,
                case 13:
                    submit(divRef?.current?.textContent);
                    break;
                // escape
                case 27:
                    onBlur();
                    break;
                default: // no default;
            }
        };

        window.addEventListener('keydown', keyboardHandler, false);

        return () => {
            window.removeEventListener('keydown', keyboardHandler, false);
        };
    }, [submit, onBlur, props.originalValue, divRef, wrapperRef]);

    return (
        <>
            <WrappedComponent {...props}>
                <div
                    contentEditable
                    ref={divRef}
                    data-test="@metadata/input"
                    style={{ paddingLeft: '1px' }}
                />
            </WrappedComponent>
            <IconWrapper bgColor={colors.NEUE_BG_LIGHT_GREEN}>
                <Icon
                    useCursorPointer
                    size={14}
                    data-test="@metadata/submit"
                    icon="CHECK"
                    onClick={e => {
                        e.stopPropagation();
                        submit(divRef?.current?.textContent);
                    }}
                    color={colors.NEUE_TYPE_GREEN}
                />
            </IconWrapper>
            <IconWrapper bgColor={colors.NEUE_BG_GRAY}>
                <Icon
                    useCursorPointer
                    size={14}
                    data-test="@metadata/cancel"
                    icon="CROSS"
                    onClick={e => {
                        e.stopPropagation();
                        onBlur();
                    }}
                    color={colors.NEUE_TYPE_DARK_GREY}
                />
            </IconWrapper>
        </>
    );
};
