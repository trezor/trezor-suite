export const countBytesInString = (input: string) => encodeURI(input).split(/%..|./).length - 1;
