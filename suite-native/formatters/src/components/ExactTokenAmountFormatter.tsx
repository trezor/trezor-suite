import {
    BaseTokenAmountFormatter,
    type TokenAmountFormatterCommonProps,
} from './BaseTokenAmountFormatter';

export type ExactTokenAmountFormatterProps = TokenAmountFormatterCommonProps & {
    maxDisplayedDecimals?: number;
};

// This should be used without a nearby fiat value or when exact precision matters.
export const ExactTokenAmountFormatter = (props: ExactTokenAmountFormatterProps) => (
    <BaseTokenAmountFormatter {...props} />
);
