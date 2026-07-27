export const RIPPLE_DECIMALS = 6;

// Network default reserves in drops, overwritten at runtime from `server_info`.
export const RIPPLE_BASE_RESERVE_DEFAULT = '10000000'; // 10 XRP
export const RIPPLE_OWNER_RESERVE_DEFAULT = '2000000'; // 2 XRP

// XRPL timestamps are based on the Ripple Epoch (2000-01-01T00:00:00Z).
// To convert to a standard Unix timestamp, add this offset.
// https://xrpl.org/docs/references/protocol/data-types/basic-data-types#specifying-time
const RIPPLE_EPOCH_OFFSET = 946684800;

export const getUnixTimestamp = (xrplTimestamp?: number): number => {
    if (!xrplTimestamp || xrplTimestamp <= 0) {
        return 0;
    }

    return xrplTimestamp + RIPPLE_EPOCH_OFFSET;
};

// tfFullyCanonicalSig — XRPL universal transaction flag
export const XRP_FLAG = 0x80000000;
