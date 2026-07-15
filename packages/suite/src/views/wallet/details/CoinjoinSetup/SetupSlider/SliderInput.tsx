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

import { borders, typography } from '@trezor/theme';

const LevelContainer = styled.div`
    width: 64px;
`;

const InputWrapper = styled.div<{ $isDisabled?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 42px;
    padding: 0 12px;
    border: 1.5px solid ${({ theme }) => theme.elementBorderField};
    border-radius: ${borders.radii.xs};
    background: none;
    cursor: ${({ $isDisabled }) => ($isDisabled ? 'not-allowed' : 'text')};
`;

const StyledInput = styled.input<{ $isDisabled?: boolean }>`
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 1px 0 0;
    background: none;
    border: none;
    outline: none;
    color: ${({ theme, $isDisabled }) =>
        $isDisabled ? theme.contentSecondary : theme.contentBrand};
    ${typography['headline-sm']}
    text-align: center;

    &::placeholder {
        color: ${({ theme }) => theme.contentSecondary};
    }
`;

const InnerAddon = styled.div`
    ${typography['body-sm']}
    color: ${({ theme }) => theme.contentSecondary};
    margin-left: 4px;
`;

const MAX_ALLOWED_INTEGER = 1000000;

export interface SliderInputProps {
    value: number | '';
    onChange: (number: number) => void;
    min: number;
    max: number;
    unit?: string;
    isDisabled?: boolean;
    className?: string;
}

export const SliderInput = forwardRef<
    { setPreviousValue: (number: number) => void },
    SliderInputProps
>(({ value, onChange, min, max, unit, isDisabled, className }, ref) => {
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
            <InputWrapper $isDisabled={isDisabled} onClick={focusInput}>
                <StyledInput
                    ref={inputRef}
                    value={String(inputValue)}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    disabled={isDisabled}
                    $isDisabled={isDisabled}
                />
                {unit && <InnerAddon>{unit}</InnerAddon>}
            </InputWrapper>
        </LevelContainer>
    );
});
