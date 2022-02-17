export const isHex = (str: string): boolean => {
    const regExp = /^(0x|0X)?[0-9A-Fa-f]+$/g;

    return regExp.test(str);
};
