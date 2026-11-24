const BRIDGE_FEE_PERCENT_FORMAT_OPTIONS = {
    style: 'percent',
    maximumFractionDigits: 3,
} as const satisfies Intl.NumberFormatOptions;

type FormatBridgeFeePercentParams = {
    feePercent: number;
    locale: string;
};

export const formatBridgeFeePercent = ({ feePercent, locale }: FormatBridgeFeePercentParams) =>
    new Intl.NumberFormat(locale, BRIDGE_FEE_PERCENT_FORMAT_OPTIONS).format(feePercent / 100);
