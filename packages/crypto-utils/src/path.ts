export const HD_HARDENED = 0x80000000;
export const toHardened = (n: number) => (n | HD_HARDENED) >>> 0;
export const fromHardened = (n: number) => (n & ~HD_HARDENED) >>> 0;

export const getSerializedPath = (path: number[]) =>
    `m/${path
        .map(i => {
            const s = (i & ~HD_HARDENED).toString();
            if (i & HD_HARDENED) {
                return `${s}'`;
            }
            return s;
        })
        .join('/')}`;
