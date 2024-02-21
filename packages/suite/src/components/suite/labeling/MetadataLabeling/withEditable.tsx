import {
    useEffect,
    useState,
    useCallback,
    useRef,
    FunctionComponent,
    PropsWithChildren,
} from 'react';

import styled, { useTheme } from 'styled-components';
import { Icon } from '@trezor/components';
import { AutoScalingInput } from '@trezor/components/src/components/AutoScalingInput/AutoScalingInput';

const IconWrapper = styled.div<{ bgColor: string }>`
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${props => props.bgColor};
    border-radius: 4px;
    margin: 0 3px;
    padding: 4px;
`;

const IconListWrapper = styled.div`
    display: flex;
    margin: 0 0 0 10px;
`;

// To inherit everything so the input looks like the text we want to edit
// However, we need to reset some properties: for example margin and padding to not duplicate spacings
const Editable = styled(AutoScalingInput)`
    all: inherit;
    margin: 0;
    padding: 0;
    border: 0 solid;
    border-radius: 0;
    cursor: text;
`;

interface WithEditableProps {
    originalValue?: string;
    onSubmit: (value: string | undefined) => void;
    onBlur: () => void;
}

/**
 * Takes component in parameter and wraps it with content-editable necessities. Renders contenteditable div as it's child
 * and control buttons (submit, cancel).
 */
export const withEditable =
    (WrappedComponent: FunctionComponent<PropsWithChildren>) =>
    ({ onSubmit, onBlur, ...props }: WithEditableProps) => {
        const [touched, setTouched] = useState(false);
        const [value, setValue] = useState('');

        const theme = useTheme();
        const divRef = useRef<HTMLInputElement>(null);

        const submit = useCallback(
            (value?: string | null) => {
                const trimmedValue = (value ?? '').trim();

                if (props.originalValue && trimmedValue === props.originalValue.trim()) {
                    return onBlur();
                }

                onSubmit(trimmedValue);
                onBlur();
            },
            [props, onSubmit, onBlur],
        );

        useEffect(() => {
            if (!divRef?.current || touched) {
                return;
            }

            if (props.originalValue) {
                setValue(props.originalValue);
            }
        }, [props.originalValue, divRef, touched, setValue]);

        useEffect(() => {
            if (!touched) {
                divRef.current?.select();
            }
        }, [value, touched]);

        return (
            <>
                <WrappedComponent {...props}>
                    <Editable
                        minWidth={20}
                        ref={divRef}
                        data-test-id="@metadata/input"
                        value={value}
                        // onBlur={onBlur}
                        onChange={event => {
                            setTouched(true);
                            setValue(event.target.value);
                        }}
                        onKeyDown={event => {
                            if (event.key === 'Enter') {
                                submit(value);
                            }
                            if (event.key === 'Escape') {
                                onBlur();
                            }
                        }}
                    />
                </WrappedComponent>

                <IconListWrapper>
                    <IconWrapper bgColor={theme.BG_LIGHT_GREEN}>
                        <Icon
                            useCursorPointer
                            size={14}
                            data-test-id="@metadata/submit"
                            icon="CHECK"
                            onClick={e => {
                                e.stopPropagation();
                                submit(value);
                            }}
                            color={theme.TYPE_GREEN}
                        />
                    </IconWrapper>

                    <IconWrapper bgColor={theme.BG_GREY}>
                        <Icon
                            useCursorPointer
                            size={14}
                            data-test-id="@metadata/cancel"
                            icon="CROSS"
                            onClick={e => {
                                e.stopPropagation();
                                onBlur();
                            }}
                            color={theme.TYPE_DARK_GREY}
                        />
                    </IconWrapper>
                </IconListWrapper>
            </>
        );
    };
