export const truncateMiddle = (text: string, startChars: number, endChars: number) => {
    if (text.length <= startChars + endChars) return text;
    const start = text.substring(0, startChars);
    const end = text.substring(text.length - endChars, text.length);

    return `${start}…${end}`;
};
