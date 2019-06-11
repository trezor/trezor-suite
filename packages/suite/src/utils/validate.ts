// RFC 5322 - http://emailregex.com/
const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export function validateEmail(value?: string): boolean {
    if (!value) return false;
    return EMAIL_REGEX.test(value);
}

export function validateASCII(value?: string): boolean {
    if (!value) return true;
    return /^[\x00-\x7F]*$/.test(value); // eslint-disable-line
}
