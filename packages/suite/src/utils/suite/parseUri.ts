export const parseUri = (uri: string) => {
    try {
        return new URL(uri);
    } catch {
        // empty
    }
};
