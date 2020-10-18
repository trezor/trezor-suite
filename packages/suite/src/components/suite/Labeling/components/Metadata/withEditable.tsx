import React, { useEffect, useState, useCallback, createRef, useRef } from 'react';
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
}

/**
 * Takes component in parameter and wraps it with content-editable necessities. Renders contenteditable div as it's child
 * and control buttons (submit, cancel).
 */
export const withEditable = (WrappedComponent: React.FC) => ({
    onSubmit,
    onBlur,
    ...props
}: Props) => {
    const [touched, setTouched] = useState(false);
    const divRef = useRef<HTMLDivElement>(null);
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
        if (!divRef?.current || touched) {
            return;
        }
        if (props.originalValue) {
            divRef.current.textContent = props.originalValue;
        }
        divRef.current.focus();
    }, [props.originalValue, divRef, touched]);

    useEffect(() => {
        const keyboardHandler = (event: KeyboardEvent) => {
            event.stopPropagation();
            switch (event.keyCode) {
                // backspace
                case 8:
                    if (!touched && divRef?.current) {
                        divRef.current.textContent = '';
                    }

                    break;
                // enter,
                case 13:
                    submit(divRef?.current?.textContent);
                    break;
                // escape
                case 27:
                    onBlur();
                    break;
                // right arrow:
                // tab
                case 39:
                case 9: {
                    event.preventDefault();
                    if (divRef?.current) {
                        moveCaretToEndOfContentEditable(divRef.current);
                        setTouched(true);
                    }

                    break;
                }
                default:
                    // any other button, just set input to "touched"
                    if (!touched && divRef?.current) {
                        divRef.current.textContent = '';
                        setTouched(true);
                    }
            }
        };

        window.addEventListener('keydown', keyboardHandler, false);

        return () => {
            window.removeEventListener('keydown', keyboardHandler, false);
        };
    }, [submit, onBlur, props.originalValue, divRef, wrapperRef, touched]);

    return (
        <>
            <WrappedComponent {...props}>
                <div
                    contentEditable
                    ref={divRef}
                    data-test="@metadata/input"
                    style={{ paddingLeft: '1px', color: !touched ? colors.BLACK50 : 'inherit' }}
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
