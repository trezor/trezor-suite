export const isValidProtocol = (uri: string, protocols: string[]) =>
    protocols.findIndex(p => uri.startsWith(`${p}:`)) > -1;
