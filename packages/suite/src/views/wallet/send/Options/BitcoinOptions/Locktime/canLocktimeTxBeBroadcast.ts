export type CanLocktimeTxBeBroadcastParams = {
    locktimeBlockHeight: number | undefined;
    locktimeDatetime: number | undefined;
    currentBlockHeight: number;
};

/**
 * Transaction with TimeLock > currentBlockHeight is considered Non-Standard.
 * Such transaction would be rejected by the full-node's Mempool with error: "non-final".
 */
export const canLocktimeTxBeBroadcast = ({
    locktimeBlockHeight,
    locktimeDatetime,
    currentBlockHeight,
}: CanLocktimeTxBeBroadcastParams) =>
    (locktimeBlockHeight === undefined || locktimeBlockHeight <= currentBlockHeight) &&
    (locktimeDatetime === undefined || locktimeDatetime * 1000 <= Date.now());
