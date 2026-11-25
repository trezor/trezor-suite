export const getShareableFileURI = (uri: string): string =>
    uri.startsWith('file://') ? uri : `file://${uri}`;
