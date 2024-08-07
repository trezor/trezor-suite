import { BTC_LOCKTIME_VALUE } from '@suite-common/wallet-constants';

export type CanLocktimeTxBeBroadcastParams = {
    locktime: number | undefined;
    currentBlockHeight: number;
};

/**
 * Transaction with TimeLock > currentBlockHeight is considered Non-Standard.
 * Such transaction would be rejected by the full-node's Mempool with error: "non-final".
 */
export const canLocktimeTxBeBroadcast = ({
    locktime,
    currentBlockHeight,
}: CanLocktimeTxBeBroadcastParams) => {
    if (locktime === undefined) {
        return true;
    }

    const isBlockLocktime = locktime < BTC_LOCKTIME_VALUE;

    if (isBlockLocktime) {
        return locktime <= currentBlockHeight;
    }

    return true; // Todo: validate locktime: new Date(locktime * 1000) < timestampOfTheLastBlock
};
