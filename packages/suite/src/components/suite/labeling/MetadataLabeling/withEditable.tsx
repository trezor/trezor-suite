import React, {
    ComponentProps,
    FunctionComponent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import styled from 'styled-components';

import { AutoScalingInput, IconButton, Row } from '@trezor/components';

// To inherit everything so the input looks like the text we want to edit
// However, we need to reset some properties: for example margin and padding to not duplicate spacings
// eslint-disable-next-line local-rules/no-override-ds-component
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
    updateFlag?: any;
}

/**
 * Takes component in parameter and wraps it with content-editable necessities. Renders contenteditable div as it's child
 * and control buttons (submit, cancel).
 */
export const withEditable =
    <C extends FunctionComponent>(
        WrappedComponent: C,
    ): FunctionComponent<Omit<WithEditableProps & ComponentProps<C>, 'children'>> =>
    ({
        onSubmit,
        onBlur,
        originalValue,
        updateFlag,
        ...rest
    }: Omit<WithEditableProps & ComponentProps<C>, 'children'>) => {
        const [touched, setTouched] = useState(false);
        const [value, setValue] = useState('');

        const divRef = useRef<HTMLInputElement>(null);

        const submit = useCallback(
            (value?: string | null) => {
                const trimmedValue = (value ?? '').trim();

                if (originalValue && trimmedValue === originalValue.trim()) {
                    return onBlur();
                }

                onSubmit(trimmedValue);
                onBlur();
            },
            [originalValue, onSubmit, onBlur],
        );

        useEffect(() => {
            if (!divRef?.current || touched) {
                return;
            }

            if (originalValue) {
                setValue(originalValue);
            }
        }, [originalValue, divRef, touched, setValue]);

        useEffect(() => {
            if (!touched) {
                divRef.current?.select();
            }
        }, [value, touched]);

        return (
            <Row gap={8}>
                {/* @ts-expect-error: this is just passing props on I am not sure why it throws here */}
                <WrappedComponent {...rest}>
                    <Editable
                        minWidth={20}
                        ref={divRef}
                        data-testid="@metadata/input"
                        value={value}
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
                        updateFlag={updateFlag}
                    />
                </WrappedComponent>
                <Row gap={4}>
                    <IconButton
                        size="small"
                        data-testid="@metadata/submit"
                        icon="check"
                        onClick={e => {
                            e.stopPropagation();
                            submit(value);
                        }}
                        intent="brand"
                        priority="secondary"
                    />
                    <IconButton
                        size="small"
                        data-testid="@metadata/cancel"
                        icon="x"
                        onClick={e => {
                            e.stopPropagation();
                            onBlur();
                        }}
                        intent="neutral"
                        priority="secondary"
                    />
                </Row>
            </Row>
        );
    };
