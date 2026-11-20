import {
    BaseTokenAmountFormatter,
    type TokenAmountFormatterCommonProps,
} from './BaseTokenAmountFormatter';

export type CompactTokenAmountFormatterProps = TokenAmountFormatterCommonProps;

// This should be used when showing a token amount alongside a fiat value (balances, lists).
export const CompactTokenAmountFormatter = (props: CompactTokenAmountFormatterProps) => (
    <BaseTokenAmountFormatter {...props} formatStyle="compact-balance" />
);
