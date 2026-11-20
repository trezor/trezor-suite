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
