export const isFullPath = (path: string) => {
    const fullPathPattern = /^(\/|([a-zA-Z]:\\))/;

    return fullPathPattern.test(path);
};
