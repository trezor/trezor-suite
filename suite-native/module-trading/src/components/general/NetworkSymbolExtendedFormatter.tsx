import { Text, type TextProps } from '@suite-native/atoms';

export type CoinSymbolProps = {
    symbol: string;
} & Omit<TextProps, 'children'>;

export const NetworkSymbolExtendedFormatter = ({ symbol, ...textProps }: CoinSymbolProps) => (
    <Text color="textSubdued" variant="body-sm" {...textProps}>
        {symbol.toUpperCase()}
    </Text>
);
