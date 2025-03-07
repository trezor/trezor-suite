import { Text, TextProps } from '@suite-native/atoms';

export type CoinSymbolProps = {
    symbol: string;
} & Omit<TextProps, 'children'>;

export const NetworkSymbolExtendedFormatter = ({ symbol, ...textProps }: CoinSymbolProps) => (
    <Text color="textSubdued" variant="hint" {...textProps}>
        {symbol.toUpperCase()}
    </Text>
);
