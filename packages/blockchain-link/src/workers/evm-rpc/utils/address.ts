/** RPC results are lowercase while Suite descriptors are EIP-55 checksummed. */
export const isSameAddress = (a: string | null | undefined, b: string | null | undefined) =>
    !!a && !!b && a.toLowerCase() === b.toLowerCase();
