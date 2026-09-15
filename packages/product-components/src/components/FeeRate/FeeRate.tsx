type FeeRateProps = {
    feeRate?: string;
    unit: string;
};

export const FeeRate = ({ feeRate, unit }: FeeRateProps) => {
    if (!feeRate) return null;

    return (
        <span data-testid="@fee-rate">
            <span data-testid="@fee-rate/value">{feeRate}</span>&nbsp;{unit}
        </span>
    );
};
