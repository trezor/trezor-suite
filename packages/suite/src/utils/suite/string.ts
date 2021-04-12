export const capitalizeFirstLetter = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const countBytesInString = (input: string) => encodeURI(input).split(/%..|./).length - 1;

export const getNumberFromPxString = (size: string): number => parseInt(size.replace('px', ''), 10);

export const truncateMiddle = (text: string, startChars: number, endChars: number) => {
    if (text.length <= startChars + endChars) return text;
    const start = text.substring(0, startChars);
    const end = text.substring(text.length - endChars, text.length);
    return `${start}…${end}`;
};
