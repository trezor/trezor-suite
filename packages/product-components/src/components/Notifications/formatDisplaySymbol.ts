const MAX_DISPLAY_SYMBOL_LENGTH = 10;

export const formatDisplaySymbol = (symbol: string): string =>
    symbol.length > MAX_DISPLAY_SYMBOL_LENGTH
        ? `${symbol.slice(0, MAX_DISPLAY_SYMBOL_LENGTH)}...`
        : symbol;
