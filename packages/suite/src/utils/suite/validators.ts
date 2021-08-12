// RFC 5322 - http://emailregex.com/
const EMAIL_REGEX =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
// Simple URL regex
const URL_REGEX =
    /^(http|ws)s?:\/\/[a-z0-9]([a-z0-9.-]+)?(:[0-9]{1,5})?((\/)?(([a-z0-9-_])+(\/)?)+)$/i;

export function isEmail(value?: string): boolean {
    if (!value) return false;
    return EMAIL_REGEX.test(value);
}

export const isUrl = (value: string): boolean => URL_REGEX.test(value);

export function isASCII(value?: string): boolean {
    if (!value) return true;
    return /^[\x00-\x7F]*$/.test(value); // eslint-disable-line
}

export const hasUppercase = (value: string) => {
    const UPPERCASE_RE = new RegExp('^(.*[A-Z].*)$');
    return UPPERCASE_RE.test(value);
};

export const isAbs = (value: string) => {
    const ABS_RE = new RegExp('^[0-9]+$');
    return ABS_RE.test(value);
};

export const hasDecimals = (value: string, decimals: number) => {
    if (decimals === 0) {
        return isAbs(value);
    }

    const ETH_DECIMALS_RE = new RegExp(
        `^(0|0\\.([0-9]{0,${decimals}})?|[1-9][0-9]*\\.?([0-9]{0,${decimals}})?)$`,
    );
    return ETH_DECIMALS_RE.test(value);
};

export const isNumber = (value: string) => {
    const NUMBER_RE = new RegExp(`^(0|0\\.([0-9]+)?|[1-9][0-9]*\\.?([0-9]+)?)$`);
    return NUMBER_RE.test(value);
};
