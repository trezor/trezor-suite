/* @flow */

export const hasUppercase = (value: string) => {
    const UPPERCASE_RE = new RegExp('^(.*[A-Z].*)$');
    return UPPERCASE_RE.test(value);
};

export const hasDecimals = (value: string, decimals: number) => {
    if (decimals === 0) {
        return isAbs(value);
    }

    const ETH_DECIMALS_RE = new RegExp(
        `^(0|0\\.([0-9]{0,${decimals}})?|[1-9][0-9]*\\.?([0-9]{0,${decimals}})?)$`
    );
    return ETH_DECIMALS_RE.test(value);
};

export const isAbs = (value: string) => {
    const ABS_RE = new RegExp('^[0-9]+$');
    return ABS_RE.test(value);
};

export const isNumber = (value: string) => {
    const NUMBER_RE = new RegExp(`^(0|0\\.([0-9]+)?|[1-9][0-9]*\\.?([0-9]+)?)$`);
    return NUMBER_RE.test(value);
};
