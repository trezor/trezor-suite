/* @flow */

export const hasUppercase = (value: string) => {
    const UPPERCASE_RE = new RegExp('^(.*[A-Z].*)$');
    return UPPERCASE_RE.test(value);
};

export const isNumber = (value: string, decimals: number = 18) => {
    if (decimals === 0) {
        return isAbs(value);
    }

    const ETH_18_RE = new RegExp(
        `^(0|0\\.([0-9]{0,${decimals}})?|[1-9][0-9]*\\.?([0-9]{0,${decimals}})?)$`
    );
    return ETH_18_RE.test(value);
};

export const isAbs = (value: string) => {
    const ABS_RE = new RegExp('^[0-9]+$');
    return ABS_RE.test(value);
};

export const isEthereumNumber = (value: string) => {
    return isNumber(value, 18);
};

export const isRippleNumber = (value: string) => {
    return isNumber(value, 6);
};
