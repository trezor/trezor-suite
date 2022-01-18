export const getNumberFromPixelString = (size: string): number =>
    parseInt(size.replace('px', ''), 10);
