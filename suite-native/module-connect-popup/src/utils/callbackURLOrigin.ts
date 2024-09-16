export const callbackURLOrigin = (fullUrl: string) => {
    try {
        const url = new URL(fullUrl);

        return `${url.protocol}//${url.host}`;
    } catch {
        return undefined;
    }
};
