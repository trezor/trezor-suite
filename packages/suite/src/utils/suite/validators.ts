// RFC 5322 - http://emailregex.com/
const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
// https://gist.github.com/jpillora/7885636
const URL_REGEX = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.​\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[​6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1​,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00​a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u​00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i;

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
