export const range = (start: number, end: number) =>
    [...new Array(end - start + 1).keys()].map((_, index) => start + index);
