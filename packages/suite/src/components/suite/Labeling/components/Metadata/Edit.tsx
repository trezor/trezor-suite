import React, { useEffect, useRef, useCallback } from 'react';
import { colors, Icon } from '@trezor/components';
import styled from 'styled-components';
import { moveCaretToEndOfContentEditable } from '@suite-utils/dom';

const IconWrapper = styled.div<{ bgColor: string }>`
    display: flex;
    align-items: center;
    justify-content: center;
    /* width: 24px;
    height: 24px; */
    /* padding: 4px; */
    background-color: ${props => props.bgColor};
    border-radius: 4px;
    margin: 0 3px;
    padding: 2px;
`;

const MetadataEdit = (props: {
    originalValue?: string;
    onSubmit: (value: string | undefined | null) => void;
    onBlur: () => void;
}) => {
    const divRef = useRef<HTMLDivElement>(null);
    const submit = useCallback(
        value => {
            if (value && value !== props.originalValue) {
                props.onSubmit(value);
            }

            if (divRef && divRef.current) {
                divRef.current.blur();
            }
            props.onBlur();
        },
        [props, divRef],
    );

    useEffect(() => {
        // Set value of content editable element; set caret to correct position;
        if (divRef && divRef.current) {
            divRef.current.textContent = props.originalValue || null;
            divRef.current.focus();
            moveCaretToEndOfContentEditable(divRef.current);
        }
    }, [props]);

    useEffect(() => {
        const keyboardHandler = (event: KeyboardEvent) => {
            switch (event.keyCode) {
                // tab
                case 9:
                    event.preventDefault();
                    break;
                // enter,
                case 13:
                    if (divRef && divRef.current) {
                        submit(divRef.current.textContent);
                    }
                    break;
                // escape
                case 27:
                    submit(props.originalValue);
                    break;
                default: // no default;
            }
        };

        window.addEventListener('keydown', keyboardHandler, false);

        return () => {
            window.removeEventListener('keydown', keyboardHandler, false);
        };
    }, [submit, props.originalValue]);

    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
                style={{ minWidth: '40px', paddingLeft: '2px', overflow: 'hidden' }}
                contentEditable
                ref={divRef}
                data-test="@metadata/input"
            />
            <IconWrapper bgColor={colors.NEUE_BG_LIGHT_GREEN}>
                <Icon
                    usePointerCursor
                    size={14}
                    data-test="@metadata/submit"
                    icon="CHECK"
                    onClick={e => {
                        e.stopPropagation();
                        submit(
                            divRef && divRef.current
                                ? divRef.current.textContent
                                : props.originalValue,
                        );
                    }}
                    color={colors.NEUE_TYPE_GREEN}
                />
            </IconWrapper>
            <IconWrapper bgColor={colors.NEUE_BG_GRAY}>
                <Icon
                    usePointerCursor
                    size={14}
                    data-test="@metadata/cancel"
                    icon="CROSS"
                    onClick={() => {
                        submit(props.originalValue);
                    }}
                    color={colors.NEUE_TYPE_DARK_GREY}
                />
            </IconWrapper>
        </div>
    );
};

export default MetadataEdit;
