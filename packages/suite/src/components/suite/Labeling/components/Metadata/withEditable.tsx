import React, { useEffect, useState, useCallback, useRef } from 'react';
import styled, { css } from 'styled-components';
import { Icon, useTheme } from '@trezor/components';

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

const IconsWrapper = styled.div`
    margin-left: 12px;
    display: flex;
`;

const Placeholder = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const Editable = styled.div<{ value?: string; isButton?: boolean; touched: boolean }>`
    padding-left: 1px;
    margin-right: 1px;
    text-align: left;
    cursor: text;

    ${props =>
        props.value &&
        css`
            position: unset;
        `}

    ${props =>
        !props.value &&
        css`
           left: ${props.isButton ? '22px;' : '0px;'}
           right: 0;
           position: absolute;
         `}

    color: ${props => (!props.touched ? props.theme.TYPE_LIGHT_GREY : 'inherit')};
`;

interface Props {
    originalValue?: string;
    defaultVisibleValue: React.ReactNode;
    onSubmit: (value: string | undefined | null) => void;
    onBlur: () => void;
    isButton?: boolean;
}

/**
 * Takes component in parameter and wraps it with content-editable necessities. Renders contenteditable div as it's child
 * and control buttons (submit, cancel).
 */
export const withEditable =
    (WrappedComponent: React.FC) =>
    ({ onSubmit, onBlur, ...props }: Props) => {
        const theme = useTheme();
        const [touched, setTouched] = useState(false);
        // value is used to mirror divRef.current.textContent so that its changes force react to render
        const [value, setValue] = useState('');
        const divRef = useRef<HTMLDivElement>(null);

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
                setValue(props.originalValue);
            }
            divRef.current.focus();
        }, [props.originalValue, divRef, touched, setValue]);

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
        }, [submit, onBlur, props.originalValue, divRef, touched]);

        return (
            <>
                <WrappedComponent {...props}>
                    <Editable
                        contentEditable
                        onKeyPress={e => setValue(e.key)}
                        onKeyUp={() => {
                            if (!divRef.current?.textContent) {
                                setValue('');
                            }
                        }}
                        onPaste={e => setValue(e.clipboardData.getData('text/plain'))}
                        ref={divRef}
                        data-test="@metadata/input"
                        touched={touched}
                        value={value}
                        isButton={props.isButton}
                    />
                    {/* show default placeholder */}
                    {!value && <Placeholder>{props.defaultVisibleValue}</Placeholder>}
                </WrappedComponent>
                <IconsWrapper>
                    <IconWrapper bgColor={theme.BG_LIGHT_GREEN}>
                        <Icon
                            useCursorPointer
                            size={14}
                            data-test="@metadata/submit"
                            icon="CHECK"
                            onClick={e => {
                                e.stopPropagation();
                                submit(divRef?.current?.textContent);
                            }}
                            color={theme.TYPE_GREEN}
                        />
                    </IconWrapper>
                    <IconWrapper bgColor={theme.BG_GREY}>
                        <Icon
                            useCursorPointer
                            size={14}
                            data-test="@metadata/cancel"
                            icon="CROSS"
                            onClick={e => {
                                e.stopPropagation();
                                onBlur();
                            }}
                            color={theme.TYPE_DARK_GREY}
                        />
                    </IconWrapper>
                </IconsWrapper>
            </>
        );
    };
