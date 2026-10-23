export type Outpoint = {
    txid: string;
    vout: number;
};

/** Stable identifier of a transaction output, used to match UTXOs with the inputs spending them. */
export const getOutpointKey = ({ txid, vout }: Outpoint) => `${txid.toLowerCase()}:${vout}`;
