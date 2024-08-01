import React, { useRef, useEffect, forwardRef, useState, ChangeEvent, useCallback } from 'react';
import styled from 'styled-components';

const HiddenInputToMeasurePlaceholderScrollableWidth = styled.input`
    visibility: hidden !important;
    width: 0 !important;
    height: 0 !important;

    /* Never change any style here! It would affect the scrollWidth calculation of the placeholder. */
`;

type ApplyWidthParams = {
    ref: React.MutableRefObject<HTMLInputElement | null>;
    minWidth: number;
};

const applyWidth = ({ minWidth, ref }: ApplyWidthParams) => {
    if (ref?.current?.style) {
        const borderSize = ref.current.offsetWidth - ref.current.clientWidth;
        // First it needs to be set to minimum, this ensures that with of the input will be shrinking as text gets smaller
        ref.current.style.width = `${minWidth + borderSize}px`; // See: https://stackoverflow.com/a/75227086
        ref.current.style.width = `${ref.current.scrollWidth + borderSize}px`;
    }
};

type ApplyOnTargetOverEventParams = {
    onChange: React.InputHTMLAttributes<HTMLInputElement>['onChange'];
    calculatedMin: number;
};

const createHandleOnChangeAndApplyNewWidth =
    ({ onChange, calculatedMin }: ApplyOnTargetOverEventParams) =>
    (event: ChangeEvent<HTMLInputElement>) => {
        const { target } = event;
        const borderSize = target.offsetWidth - target.clientWidth;
        // See: `applyWidth` function for explanation.
        // It cannot be used here as we work with `target` from event and not react Ref.
        target.style.width = `${calculatedMin + borderSize}px`; // See: https://stackoverflow.com/a/75227086
        target.style.width = `${target.scrollWidth + borderSize}px`;
        onChange?.(event);
    };

export interface Props
    extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    minWidth: number;
    updateFlag?: any;
}

const StyledInput = styled.input`
    &:disabled {
        pointer-events: auto;
        cursor: not-allowed;
    }
`;

/**
 * TODO: This is Labeling Input and this maybe consolidated with `withEditable`
 */
export const AutoScalingInput = forwardRef<HTMLInputElement, Props>(
    ({ value, minWidth, updateFlag, ...props }, ref) => {
        const [placeholderWidth, setPlaceholderWidth] = useState(0);
        const inputRef = useRef<HTMLInputElement | null>(null);
        const placeholderMeasureRef = useRef<HTMLInputElement | null>(null);

        const calculatedMin = Math.max(minWidth, placeholderWidth);

        // Measure the size of the placeholder
        useEffect(() => {
            if (placeholderMeasureRef?.current?.style) {
                setPlaceholderWidth(placeholderMeasureRef.current.scrollWidth ?? 0);
            }
        }, [setPlaceholderWidth, value, updateFlag]);

        useEffect(() => {
            applyWidth({
                minWidth: calculatedMin,
                ref: inputRef,
            });
        }, [inputRef, calculatedMin]);

        const innerRef = useCallback(
            (e: HTMLInputElement) => {
                if (ref && typeof ref === 'object') {
                    ref.current = e;
                }
                if (ref && typeof ref === 'function') {
                    ref(e);
                }

                inputRef.current = e;
            },
            [ref],
        );

        return (
            <>
                <HiddenInputToMeasurePlaceholderScrollableWidth
                    className={props.className} // It is important to keep styles so the width is properly calculated
                    style={props.style} // It is important to keep styles so the width is properly calculated
                    type="text"
                    ref={placeholderMeasureRef}
                    value={value ?? props.placeholder}
                    readOnly
                />
                <StyledInput
                    {...props}
                    ref={innerRef}
                    type="text"
                    value={value}
                    onChange={createHandleOnChangeAndApplyNewWidth({
                        onChange: props.onChange,
                        calculatedMin,
                    })}
                />
            </>
        );
    },
);
