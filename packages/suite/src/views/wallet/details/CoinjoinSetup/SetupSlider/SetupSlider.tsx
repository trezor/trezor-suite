import { type ChangeEventHandler, type KeyboardEventHandler, type ReactNode, useRef } from 'react';

import styled from 'styled-components';

import { Paragraph, Range, type RangeProps, Row } from '@trezor/components';

import { useSelector } from 'src/hooks/suite/useSelector';
import { selectCurrentCoinjoinSession } from 'src/reducers/wallet/coinjoinReducer';

import { SliderInput, type SliderInputProps } from './SliderInput';

const StyledSliderInput = styled(SliderInput)<{ $width?: number }>`
    width: ${({ $width }) => $width && `${$width}px`};
`;

interface SetupSliderProps
    extends
        Pick<SliderInputProps, 'isDisabled' | 'max' | 'min' | 'onChange' | 'unit'>,
        Pick<RangeProps, 'labels' | 'onLabelClick' | 'trackStyle'> {
    children?: ReactNode;
    description: ReactNode;
    heading: ReactNode;
    inputWidth?: number;
    modifyPosition?: (value: number) => number;
    sliderValue?: RangeProps['value'];
    value: number;
}

export const SetupSlider = ({
    children,
    description,
    heading,
    inputWidth,
    labels,
    max,
    min,
    modifyPosition,
    onChange,
    sliderValue,
    trackStyle,
    unit,
    value,
}: SetupSliderProps) => {
    const session = useSelector(selectCurrentCoinjoinSession);

    const inputRef = useRef<{ setPreviousValue: (number: number) => void }>(null);

    const inputValue = value ?? min; // Fallback to min if undefined (e.g. because of missing migration).

    const handleChange = (value: number) => {
        // Remember previous value for numerical input.
        inputRef.current?.setPreviousValue(value);
        onChange(value);
    };
    const handleSliderChange: ChangeEventHandler<HTMLInputElement> = e => {
        let value = Number(e.target.value);
        // Adjust position for a logarithmic slider.
        if (modifyPosition) {
            value = modifyPosition(value);
        }
        handleChange(value);
    };
    // Adjust arrow controls for a logarithmic slider.
    const handleKeyDown: KeyboardEventHandler = e => {
        if (['ArrowRight', 'ArrowUp'].includes(e.key) && value < max) {
            e.preventDefault();
            handleChange(value + 1);
        } else if (['ArrowLeft', 'ArrowDown'].includes(e.key) && value > min) {
            e.preventDefault();
            handleChange(value - 1);
        }
    };

    return (
        <div>
            <Row alignItems="center" justifyContent="space-between" gap={12}>
                <Paragraph typographyStyle="headline-sm">{heading}</Paragraph>
                <StyledSliderInput
                    ref={inputRef}
                    value={inputValue}
                    onChange={onChange}
                    isDisabled={!!session}
                    min={min}
                    max={max}
                    unit={unit}
                    $width={inputWidth}
                />
            </Row>
            <Paragraph
                typographyStyle="body-sm"
                margin={{ vertical: 8 }}
                intent="neutral"
                priority="secondary"
            >
                {description}
            </Paragraph>
            <Range
                min={min}
                max={max}
                value={sliderValue ?? inputValue}
                onChange={handleSliderChange}
                trackStyle={trackStyle}
                labels={labels}
                onLabelClick={handleChange}
                onKeyDown={modifyPosition && handleKeyDown}
                disabled={!!session}
            />
            {children}
        </div>
    );
};
