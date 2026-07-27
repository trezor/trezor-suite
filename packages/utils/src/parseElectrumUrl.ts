// Todo: one day, we shall purify the @trezor/utils and remove domain-specific stuff from it

// URL is in format host:port:[t|s] (t for tcp, s for ssl)
const ELECTRUM_URL_REGEX = /^(?:([a-zA-Z0-9.-]+)|\[([a-f0-9:]+)\]):([0-9]{1,5}):([ts])$/;

export const parseElectrumUrl = (url: string) => {
    const match = url.match(ELECTRUM_URL_REGEX);
    if (!match) return undefined;

    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const m1: string = match[1];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const m2: string = match[2];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const m3: string = match[3];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const m4: string = match[4];

    return {
        host: m1 ?? m2,
        port: Number.parseInt(m3, 10),
        protocol: m4 as 't' | 's',
    };
};
