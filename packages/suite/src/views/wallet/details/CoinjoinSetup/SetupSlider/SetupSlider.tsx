import { useRef, ReactNode, KeyboardEventHandler, ChangeEventHandler } from 'react';
import styled from 'styled-components';

import { useSelector } from 'src/hooks/suite/useSelector';
import { Range, RangeProps, variables } from '@trezor/components';
import { selectCurrentCoinjoinSession } from 'src/reducers/wallet/coinjoinReducer';
import { SliderInput, SliderInputProps } from './SliderInput';

const Row = styled.div`
    align-items: center;
    display: flex;
    justify-content: space-between;
    gap: 12px;
`;

const Heading = styled.div`
    font-size: ${variables.FONT_SIZE.H3};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Description = styled.p`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin: 8px 0;
`;

const StyledSliderInput = styled(SliderInput)<{ width?: number }>`
    width: ${({ width }) => width && `${width}px`};
`;

interface SetupSliderProps
    extends Pick<SliderInputProps, 'isDisabled' | 'max' | 'min' | 'onChange' | 'unit'>,
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
            <Row>
                <Heading>{heading}</Heading>
                <StyledSliderInput
                    ref={inputRef}
                    value={inputValue}
                    onChange={onChange}
                    isDisabled={!!session}
                    min={min}
                    max={max}
                    unit={unit}
                    width={inputWidth}
                />
            </Row>
            <Description>{description}</Description>
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
