import type { Dispatch, GetState } from 'src/types/suite';
import type { PollingKey } from 'src/types/wallet/polling';
import { POLLING } from './constants';

export type PollingAction =
    | {
          type: typeof POLLING.START;
          key: PollingKey;
          pollingFunction: () => void;
          intervalMs: number;
          maxPollingRequestCount: number;
      }
    | {
          type: typeof POLLING.STOP;
          key: PollingKey;
      }
    | {
          type: typeof POLLING.REQUEST;
          key: PollingKey;
          timeoutId?: number;
      };

export const startPolling = (
    key: PollingKey,
    pollingFunction: () => void,
    pollingIntervalMs: number,
    maxPollingRequestCount: number,
): PollingAction => ({
    type: POLLING.START,
    key,
    pollingFunction,
    intervalMs: pollingIntervalMs,
    maxPollingRequestCount,
});

export const request = (key: PollingKey, timeoutId?: number): PollingAction => ({
    type: POLLING.REQUEST,
    key,
    timeoutId,
});

export const isPolling = (key: PollingKey) => (_: Dispatch, getState: GetState) =>
    !!getState().wallet.pollings[key];

export const stopPolling = (key: PollingKey) => (dispatch: Dispatch, getState: GetState) => {
    const polling = getState().wallet.pollings[key];
    if (polling?.timeoutId) {
        window.clearTimeout(polling.timeoutId);
    }
    dispatch({
        type: POLLING.STOP,
        key,
    });
};
