import { type ChangeEvent, type ClipboardEvent, useEffect, useRef, useState } from 'react';

import styled from 'styled-components';

import { borders, typography } from '@trezor/theme';

import { Row } from '../Flex/Flex';

const SymbolBox = styled.input<{ $fakeDisabled?: boolean }>`
    height: 60px;
    width: 50px;
    background: ${({ theme }) => theme.backgroundNeutralSubtleOnElevation0};
    border: 1px solid ${({ theme }) => theme.borderInputDefault};
    border-radius: ${borders.radii.lg};
    outline: 0;
    text-align: center;
    caret-color: transparent;
    font-feature-settings:
        'tnum' 1,
        'zero' 1,
        'ss03' 1;

    ${typography['headline-md']}

    &:focus,
    &:focus-within {
        border: 2px solid ${({ theme }) => theme.borderSecondary};
    }

    ${({ theme, $fakeDisabled }) =>
        // This is here to prevent jump of browser-native focus jump to the next element.
        // For example, it may focus the close [X] button of the Modal and user may accidentaly close
        // it by hitting the enter key.
        $fakeDisabled &&
        `
        pointer-events: none;
        cursor: default;
        border: 0;
        color: ${theme.textDisabled};
    `}
`;

type Symbol = '' | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

const EMPTY_SYMBOL: Symbol = '';

const SYMBOL_PATTERN = /^\d$/;

const isSymbolValid = (value: string): value is Symbol => SYMBOL_PATTERN.test(value);

const setSymbolAtPosition = (symbols: Symbol[], newSymbol: Symbol, index: number) => [
    ...symbols.slice(0, index),
    newSymbol,
    ...symbols.slice(index + 1),
];

type SymbolInputProps = {
    symbol: Symbol;
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onChange: (value: Symbol) => void;
    onClick: () => void;
    onPaste: (e: ClipboardEvent<HTMLInputElement>) => void;
    isDisabled?: boolean;
    autoFocus?: boolean;
    inputRef?: (instance: HTMLInputElement | null) => void;
};

const SymbolInput = ({
    symbol,
    onKeyDown,
    onChange,
    onClick,
    onPaste,
    isDisabled,
    autoFocus,
    inputRef,
}: SymbolInputProps) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (isDisabled) {
            e.preventDefault();

            return;
        }

        const newValue = e.target.value
            // This is a trick how to solve the caret issue. Problem is that we do not know
            // where the caret is in the underlying <input>. It can be before or after the symbol.
            // But because we only care about exactly one character, we can just remove the old one.
            // The newly added will then remain regardless if we had caret before or after the old.
            .replace(symbol, '')
            .slice(-1); // Just to make sure we end-up with only one character

        if (!isSymbolValid(newValue)) {
            return;
        }

        onChange(newValue);
    };

    return (
        <SymbolBox
            onKeyDown={onKeyDown}
            value={symbol}
            ref={inputRef}
            onChange={handleChange}
            onClick={onClick}
            onPaste={onPaste}
            disabled={false} // intentionally `false` always use `$fakeDisabled` instead
            $fakeDisabled={isDisabled}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={autoFocus}
            inputMode="numeric"
            pattern="[0-9]*"
        />
    );
};

const parseDefaultCode = (code: string, length: number): Symbol[] => {
    const chars = Array.from(code).filter(isSymbolValid);

    return Array.from({ length }, (_, index) => chars[index] ?? EMPTY_SYMBOL);
};

export type PinInputProps = {
    length: number;
    onComplete: (value: string) => void;
    onChange?: (value: string) => void;
    isDisabled?: boolean;
    autoFocus?: boolean;
    defaultCode?: string;
};

export const PinInput = ({
    length,
    onChange,
    onComplete,
    isDisabled,
    autoFocus,
    defaultCode = '',
}: PinInputProps) => {
    const [symbols, setSymbols] = useState<Symbol[]>(parseDefaultCode(defaultCode, length));
    const refs = useRef<HTMLInputElement[]>([]);
    const focusAt = (target: number) => {
        refs.current[target]?.focus();
    };

    useEffect(() => {
        onChange?.(symbols.join(''));

        if (symbols.filter(symbol => symbol !== EMPTY_SYMBOL).length === length) {
            const newCode = symbols.join('');
            if (newCode !== defaultCode?.slice(0, length)) {
                onComplete(newCode);
            }
        }
    }, [length, onChange, onComplete, symbols, defaultCode]);

    useEffect(() => {
        setSymbols(parseDefaultCode(defaultCode, length));
    }, [length, defaultCode]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (isDisabled) {
            e.preventDefault();

            return;
        }

        if (e.key === 'Backspace') {
            e.preventDefault();
            const shouldMoveToPrevious = index - 1 >= 0 && e.currentTarget.value === EMPTY_SYMBOL;

            setSymbols(prev =>
                setSymbolAtPosition(prev, EMPTY_SYMBOL, shouldMoveToPrevious ? index - 1 : index),
            );

            if (shouldMoveToPrevious) {
                focusAt(index - 1);
            }

            return;
        }

        if (e.key === 'Delete') {
            e.preventDefault();
            setSymbols(prev => setSymbolAtPosition(prev, EMPTY_SYMBOL, index));

            return;
        }

        if (e.key === 'ArrowLeft' && index - 1 >= 0) {
            focusAt(index - 1);
        }

        if (e.key === 'ArrowRight' && index + 1 < length) {
            focusAt(index + 1);
        }

        if (e.key === 'Tab' && e.shiftKey && index - 1 >= 0) {
            e.preventDefault();
            focusAt(index - 1);
        }

        if (e.key === 'Tab' && !e.shiftKey && index + 1 < length) {
            e.preventDefault();
            focusAt(index + 1);
        }
    };

    const handleCodeChange = (newCode: Symbol, index: number) => {
        setSymbols(prev => setSymbolAtPosition(prev, newCode, index));

        if (newCode.length > 0 && index + 1 < length) {
            focusAt(index + 1);
        }
    };

    const handleOnPaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
        e.preventDefault();
        const symbolsToPaste = Array.from(e.clipboardData.getData('text')).filter(isSymbolValid);
        const newIndex = Math.min(index + symbolsToPaste.length, length - 1);

        const newSymbols = [
            ...symbols.slice(0, index),
            ...symbolsToPaste,
            ...symbols.slice(index + symbolsToPaste.length),
        ].slice(0, length);

        setSymbols(newSymbols);
        focusAt(newIndex);
    };

    return (
        <Row gap={8}>
            {symbols.map((symbol, index) => (
                <SymbolInput
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus={autoFocus === true && index === 0}
                    symbol={symbol}
                    key={index}
                    onKeyDown={e => handleKeyDown(e, index)}
                    inputRef={component => {
                        if (component !== null) {
                            refs.current[index] = component;
                        }
                    }}
                    onChange={value => handleCodeChange(value, index)}
                    onClick={() => focusAt(index)}
                    onPaste={e => handleOnPaste(e, index)}
                    isDisabled={isDisabled}
                />
            ))}
        </Row>
    );
};
