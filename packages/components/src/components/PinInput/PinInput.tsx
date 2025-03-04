import { ChangeEvent, ClipboardEvent, forwardRef, useEffect, useRef, useState } from 'react';

import styled from 'styled-components';

import { Elevation, borders, spacings, spacingsPx, typography } from '@trezor/theme';

import { useElevation } from '../ElevationContext/ElevationContext';
import { Row } from '../Flex/Flex';
import { baseInputStyle } from '../form/styles';

const SymbolBox = styled.input<{ $elevation: Elevation }>`
    ${baseInputStyle};

    height: ${spacingsPx.xxxxxl};
    width: ${spacingsPx.xxxxl};
    text-align: center;

    ${typography.titleMedium}
    border-radius: ${borders.radii.lg};

    &:focus,
    &:focus-within {
        border-color: ${({ theme }) => theme.backgroundPrimaryDefault};
    }

    caret-color: transparent;
`;

type Symbol = '' | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

const EMPTY_SYMBOL: Symbol = '';

const SYMBOL_PATTERN = /^\d$/;

const isSymbolValid = (newValue: string): newValue is Symbol =>
    newValue.length !== 0 && SYMBOL_PATTERN.test(newValue);

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
};

const SymbolInput = forwardRef<HTMLInputElement, SymbolInputProps>(
    ({ symbol, onKeyDown, onChange, onClick, onPaste }, ref) => {
        const { elevation } = useElevation();

        const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
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
                ref={ref}
                onChange={handleChange}
                onClick={onClick}
                $elevation={elevation}
                onPaste={onPaste}
            />
        );
    },
);

export type PinInputProps = {
    length: number;
    onComplete: (value: string) => void;
    onChange: (value: string) => void;
};

export const PinInput = ({ length, onChange, onComplete }: PinInputProps) => {
    const [symbols, setSymbols] = useState<Symbol[]>(new Array(length).fill(''));
    const refs = useRef<HTMLInputElement[]>([]);

    useEffect(() => {
        onChange(symbols.join(''));

        if (symbols.filter(symbol => symbol !== EMPTY_SYMBOL).length === length) {
            onComplete(symbols.join(''));
        }
    }, [length, onChange, onComplete, symbols]);

    useEffect(() => {
        setSymbols(new Array(length).fill(''));
    }, [length]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace') {
            e.preventDefault();
            setSymbols(setSymbolAtPosition(symbols, EMPTY_SYMBOL, index));

            if (index - 1 >= 0 && symbols[index] === EMPTY_SYMBOL) {
                refs.current[index - 1].focus();
            }
        }

        if (e.key === 'Delete') {
            e.preventDefault();
            setSymbols(setSymbolAtPosition(symbols, EMPTY_SYMBOL, index));
        }

        if (e.key === 'ArrowLeft' && index - 1 >= 0) {
            refs.current[index - 1].focus();
        }

        if (e.key === 'ArrowRight' && index + 1 < length) {
            refs.current[index + 1].focus();
        }

        if (e.key === 'Tab' && e.shiftKey && index - 1 >= 0) {
            e.preventDefault();
            refs.current[index - 1].focus();
        }

        if (e.key === 'Tab' && !e.shiftKey && index + 1 < length) {
            e.preventDefault();
            refs.current[index + 1].focus();
        }
    };

    const handleCodeChange = (newCode: Symbol, index: number) => {
        setSymbols(setSymbolAtPosition(symbols, newCode, index));

        if (newCode.length > 0 && index + 1 < length) {
            refs.current[index + 1].focus();
        }
    };

    const handleOnPaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
        e.preventDefault();
        const clipboardText = e.clipboardData.getData('text');
        const symbolsToPaste = clipboardText.split('').filter(isSymbolValid);

        const newSymbols = [
            ...symbols.slice(0, index),
            ...symbolsToPaste,
            ...symbols.slice(index + symbolsToPaste.length),
        ].slice(0, length);

        setSymbols(newSymbols);

        const newIndex = Math.min(index + symbolsToPaste.length, length - 1);
        refs.current[newIndex].focus();
    };

    return (
        <Row gap={spacings.xs}>
            {symbols.map((symbol, index) => (
                <SymbolInput
                    symbol={symbol}
                    key={index}
                    onKeyDown={e => handleKeyDown(e, index)}
                    ref={component => {
                        if (component !== null) {
                            refs.current[index] = component;
                        }
                    }}
                    onChange={value => handleCodeChange(value, index)}
                    onClick={() => refs.current[index].focus()}
                    onPaste={e => handleOnPaste(e, index)}
                />
            ))}
        </Row>
    );
};
