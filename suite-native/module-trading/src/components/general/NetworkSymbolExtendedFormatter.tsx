import { Text, type TextProps } from '@suite-native/atoms';

export type CoinSymbolProps = {
    symbol: string;
} & Omit<TextProps, 'children'>;

export const NetworkSymbolExtendedFormatter = ({ symbol, ...textProps }: CoinSymbolProps) => (
    <Text color="contentSecondary" variant="body-sm" {...textProps}>
        {symbol.toUpperCase()}
    </Text>
);
