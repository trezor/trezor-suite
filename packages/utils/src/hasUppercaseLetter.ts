const HAS_UPPERCASE_LATER_REGEXP = /^(.*[A-Z].*)$/;

export const hasUppercaseLetter = (value: string) => HAS_UPPERCASE_LATER_REGEXP.test(value);
