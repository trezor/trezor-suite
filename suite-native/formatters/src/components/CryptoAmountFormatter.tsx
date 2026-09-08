import { type CryptoAmountFormatterFormatStyle } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { toTokenSymbol } from '@suite-common/wallet-types';
import { type TextProps } from '@suite-native/atoms';
import { exhaustive } from '@trezor/type-utils';

import { CompactCryptoAmountFormatter } from './CompactCryptoAmountFormatter';
import { CompactTokenAmountFormatter } from './CompactTokenAmountFormatter';
import { EmptyAmountSkeleton } from './EmptyAmountSkeleton';
import { ExactCryptoAmountFormatter } from './ExactCryptoAmountFormatter';
import { ExactTokenAmountFormatter } from './ExactTokenAmountFormatter';
import { asDecimalTokenAmount } from '../utils';

type CryptoAmountFormatterTokenProps =
    | {
          tokenContract?: null;
          tokenDecimals?: undefined;
          tokenSymbol?: undefined;
      }
    | {
          tokenContract: string | null | undefined;
          tokenDecimals?: number;
          tokenSymbol?: string | null;
      };

export type CryptoAmountFormatterProps = {
    value: string | number | null;
    symbol: NetworkSymbol;
    formatStyle: CryptoAmountFormatterFormatStyle;
    isBalance?: boolean;
    isDiscreetText?: boolean;
    maxDisplayedDecimals?: number;
} & CryptoAmountFormatterTokenProps &
    TextProps;

export const CryptoAmountFormatter = ({
    value,
    symbol,
    formatStyle,
    isBalance,
    isDiscreetText,
    maxDisplayedDecimals,
    tokenContract,
    tokenDecimals,
    tokenSymbol,
    ...textProps
}: CryptoAmountFormatterProps) => {
    const resolvedTokenSymbol = tokenSymbol ? toTokenSymbol(tokenSymbol) : null;

    if (value === null) {
        return <EmptyAmountSkeleton variant={textProps.variant ?? 'body-sm'} />;
    }

    if (tokenContract) {
        switch (formatStyle) {
            case 'compact-balance':
                return (
                    <CompactTokenAmountFormatter
                        value={asDecimalTokenAmount(value)}
                        tokenDecimals={tokenDecimals}
                        tokenSymbol={resolvedTokenSymbol}
                        isDiscreetText={isDiscreetText}
                        {...textProps}
                    />
                );
            case 'exact':
                return (
                    <ExactTokenAmountFormatter
                        value={asDecimalTokenAmount(value)}
                        maxDisplayedDecimals={maxDisplayedDecimals}
                        tokenSymbol={resolvedTokenSymbol}
                        isDiscreetText={isDiscreetText}
                        {...textProps}
                    />
                );
            default:
                return exhaustive(formatStyle);
        }
    }

    switch (formatStyle) {
        case 'compact-balance':
            return (
                <CompactCryptoAmountFormatter
                    value={value}
                    symbol={symbol}
                    isBalance={isBalance}
                    isDiscreetText={isDiscreetText}
                    {...textProps}
                />
            );
        case 'exact':
            return (
                <ExactCryptoAmountFormatter
                    value={value}
                    symbol={symbol}
                    isBalance={isBalance}
                    isDiscreetText={isDiscreetText}
                    maxDisplayedDecimals={maxDisplayedDecimals}
                    {...textProps}
                />
            );
        default:
            return exhaustive(formatStyle);
    }
};
