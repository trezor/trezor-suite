export const capitalizeFirstLetter = (s: string) => {
    return s.charAt(0).toUpperCase() + s.slice(1);
};

export const countBytesInString = (input: string) => {
    return encodeURI(input).split(/%..|./).length - 1;
};

export const getNumberFromPxString = (size: string): number => {
    return parseInt(size.replace('px', ''), 10);
};
