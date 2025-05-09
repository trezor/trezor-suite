export const getMaxDecimalsRegex = (decimals: number) => new RegExp(`[.](\\d{${decimals}})(\\d+)$`);

export const truncateDecimals = <T extends string | undefined>(
    value: T,
    decimals: number | undefined,
): T => {
    if (value === undefined || decimals === undefined) {
        return value;
    }

    return value.replace(getMaxDecimalsRegex(decimals), '.$1') as T;
};
