// URL is in format host:port:[t|s] (t for tcp, s for ssl)
const ELECTRUM_URL_REGEX = /^(?:([a-zA-Z0-9.-]+)|\[([a-f0-9:]+)\]):([0-9]{1,5}):([ts])$/;

export const parseElectrumUrl = (url: string) => {
    const match = url.match(ELECTRUM_URL_REGEX);
    if (!match) return undefined;

    return {
        host: match[1] ?? match[2],
        port: Number.parseInt(match[3], 10),
        protocol: match[4] as 't' | 's',
    };
};
