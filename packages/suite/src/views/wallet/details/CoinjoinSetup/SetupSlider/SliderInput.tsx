import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
    KeyboardEvent,
    ChangeEvent,
} from 'react';
import styled from 'styled-components';
import { Input, InputProps, variables } from '@trezor/components';

const LevelContainer = styled.div`
    width: 64px;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const Level = styled(Input)`
    input {
        background: none;
        height: 42px;
        padding: ${({ innerAddon }) => !innerAddon && '1px 12px 0 12px'};
        border: 1.5px solid ${({ theme }) => theme.legacy.STROKE_GREY};
        color: ${({ theme }) => theme.legacy.TYPE_GREEN};
        font-size: ${variables.FONT_SIZE.H3};
        text-align: center;

        &:disabled {
            color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
        }
    }
`;

const InnerAddon = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
`;

const MAX_ALLOWED_INTEGER = 1000000;

export interface SliderInputProps extends Pick<InputProps, 'isDisabled' | 'innerAddonAlign'> {
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
                innerAddon={<InnerAddon onClick={focusInput}>{unit}</InnerAddon>}
                innerRef={inputRef}
                {...props}
            />
        </LevelContainer>
    );
});
