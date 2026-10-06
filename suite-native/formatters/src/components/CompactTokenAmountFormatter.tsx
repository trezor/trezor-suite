import {
    BaseTokenAmountFormatter,
    type TokenAmountFormatterCommonProps,
} from './BaseTokenAmountFormatter';

export type CompactTokenAmountFormatterProps = TokenAmountFormatterCommonProps & {
    // The token's decimal precision, used to select money-like formatting for stablecoins.
    tokenDecimals?: number;
};

// This should be used when showing a token amount alongside a fiat value (balances, lists).
export const CompactTokenAmountFormatter = ({
    tokenDecimals,
    ...props
}: CompactTokenAmountFormatterProps) => (
    <BaseTokenAmountFormatter
        {...props}
        tokenDecimals={tokenDecimals}
        formatStyle="compact-balance"
    />
);
