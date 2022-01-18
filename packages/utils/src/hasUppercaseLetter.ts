const HAS_UPPERCASE_LATER_REGEXP = new RegExp('^(.*[A-Z].*)$');

export const hasUppercaseLetter = (value: string) => HAS_UPPERCASE_LATER_REGEXP.test(value);
