import { type CryptoAmountFormatterFormatStyle, useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol, isNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import { BlurUrls, Box, HStack, Text, type TextProps } from '@suite-native/atoms';
import { TokenName } from '@suite-native/tokens';

import { type FormatterProps } from '../types';
import { type DecimalTokenAmount } from '../utils';
import { AmountText } from './AmountText';

const textAlignToJustifyContent = {
    auto: 'flex-start',
    left: 'flex-start',
    right: 'flex-end',
    center: 'center',
    justify: 'flex-start',
} as const;

export type TokenAmountFormatterCommonProps = {
    tokenSymbol: TokenSymbol | null;
    isDiscreetText?: boolean;
    isPhishingTransaction?: boolean;
    networkSymbol?: NetworkSymbol;
    tokenContract?: TokenAddress;
} & FormatterProps<DecimalTokenAmount> &
    TextProps;

export type BaseTokenAmountFormatterProps = TokenAmountFormatterCommonProps & {
    // The token's decimal precision. Used only to decide the display style (e.g. money-like
    // formatting for stablecoins). The `value` is always expected in human-readable units.
    tokenDecimals?: number;
    maxDisplayedDecimals?: number;
    formatStyle?: CryptoAmountFormatterFormatStyle;
};

export const BaseTokenAmountFormatter = ({
    value,
    tokenSymbol,
    isDiscreetText = true,
    tokenDecimals,
    maxDisplayedDecimals,
    variant = 'body-sm',
    color = 'contentSecondary',
    isPhishingTransaction = false,
    networkSymbol,
    tokenContract,
    formatStyle,
    textAlign = 'left',
    testID,
    ...rest
}: BaseTokenAmountFormatterProps) => {
    // Phishing transactions values may be equal to empty string, so we replace it with 0.
    // These values are hidden by discreet mode, so the exact value does not matter anyway.
    const decimalValue = isPhishingTransaction || !value ? '0' : value.toString();

    const { CryptoAmountFormatter: formatter, DisplaySymbolFormatter } = useFormatters();
    const formattedValue = formatter.format(decimalValue, {
        symbol: tokenSymbol ?? undefined,
        withSymbol: false,
        maxDisplayedDecimals,
        formatStyle,
        tokenDecimals,
    });
    const formattedSymbol =
        tokenSymbol && isNetworkSymbol(tokenSymbol)
            ? DisplaySymbolFormatter.format(tokenSymbol)
            : tokenSymbol;
    const textProps = { variant, color, textAlign, ...rest };

    return (
        <HStack
            spacing={0}
            alignItems="center"
            flexShrink={1}
            justifyContent={textAlignToJustifyContent[textAlign]}
            testID={testID}
        >
            <Box flexShrink={1}>
                <AmountText
                    value={formattedValue}
                    isDiscreetText={isDiscreetText}
                    isForcedDiscreetMode={isPhishingTransaction}
                    {...textProps}
                />
            </Box>
            {!!formattedSymbol && (
                <Box flexShrink={1}>
                    <Text {...textProps}>
                        {'\u00a0'}
                        {networkSymbol === undefined ? (
                            <BlurUrls text={formattedSymbol} {...textProps} />
                        ) : (
                            <TokenName
                                text={formattedSymbol}
                                networkSymbol={networkSymbol}
                                tokenContract={tokenContract}
                                {...textProps}
                            />
                        )}
                    </Text>
                </Box>
            )}
        </HStack>
    );
};
