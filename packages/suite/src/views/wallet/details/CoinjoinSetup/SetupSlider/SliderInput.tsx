import {
    type ChangeEvent,
    type KeyboardEvent,
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';

import styled from 'styled-components';

import { Input, type InputProps, useElevation } from '@trezor/components';
import { type Elevation, mapElevationToBorder, typography } from '@trezor/theme';

const LevelContainer = styled.div`
    width: 64px;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const Level = styled(Input)<{ $elevation: Elevation }>`
    input {
        background: none;
        height: 42px;
        padding: ${({ rightContent }) => !rightContent && '1px 12px 0 12px'};
        border: 1.5px solid ${mapElevationToBorder};
        color: ${({ theme }) => theme.contentBrand};
        ${typography['headline-sm']}
        text-align: center;

        &:disabled {
            color: ${({ theme }) => theme.contentSecondary};
        }
    }
`;

const InnerAddon = styled.div`
    ${typography['body-sm']}
    color: ${({ theme }) => theme.contentSecondary};
`;

const MAX_ALLOWED_INTEGER = 1000000;

export interface SliderInputProps extends Pick<InputProps, 'isDisabled'> {
    value: number | '';
    onChange: (number: number) => void;
    min: number;
    max: number;
    unit?: string;
    className?: string;
}

export const SliderInput = forwardRef<
    { setPreviousValue: (number: number) => void },
    SliderInputProps
>(({ value, onChange, min, max, unit, className, ...props }, ref) => {
    const { elevation } = useElevation();
    const [inputValue, setInputValue] = useState<number | ''>(value);

    const inputRef = useRef<HTMLInputElement>(null);
    const previousValue = useRef(inputValue);

    useImperativeHandle(
        ref,
        () => ({
            setPreviousValue(number) {
                previousValue.current = number;
            },
        }),
        [],
    );

    useEffect(() => {
        if (value !== inputValue) {
            setInputValue(value);
        }
    }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        if (target.value === '') {
            setInputValue('');

            return;
        }

        const number = Number(target.value);
        if (Number.isNaN(number) || number > MAX_ALLOWED_INTEGER) {
            return;
        }

        previousValue.current = number;
        setInputValue(number);
    };

    const handleFocus = () => {
        setInputValue('');
    };

    const handleBlur = () => {
        let formattedNumber = Number(inputValue);

        if (!formattedNumber && previousValue.current !== '') {
            formattedNumber = previousValue.current;
        }

        if (formattedNumber < min) {
            formattedNumber = min;
        }

        if (formattedNumber > max) {
            formattedNumber = max;
        }

        setInputValue(formattedNumber);
        onChange(formattedNumber);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            inputRef.current?.blur();
        }
    };

    const focusInput = () => inputRef.current?.focus();

    return (
        <LevelContainer className={className}>
            <Level
                value={String(inputValue)}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                rightContent={<InnerAddon onClick={focusInput}>{unit}</InnerAddon>}
                innerRef={inputRef}
                $elevation={elevation}
                {...props}
            />
        </LevelContainer>
    );
});
