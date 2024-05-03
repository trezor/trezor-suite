export const uin8ArrayToBuffer = <T extends Uint8Array | null | undefined>(
    array: T,
): T extends Uint8Array ? Buffer : T extends null ? null : undefined =>
    // eslint-disable-next-line no-nested-ternary
    (array === null
        ? null
        : array === undefined
          ? undefined
          : Buffer.from(array)) as T extends Uint8Array
        ? Buffer
        : T extends null
          ? null
          : undefined;
