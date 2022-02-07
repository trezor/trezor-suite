import type { PollingKeyPrefix } from '@wallet-types/polling';
import { POLLING } from './constants';

export type PollingAction =
    | {
          type: typeof POLLING.START;
          key: string;
          pollingFunction: () => void;
          pollingIntervalMs: number;
      }
    | {
          type: typeof POLLING.STOP;
          key: string;
      }
    | {
          type: typeof POLLING.REQUEST;
          key: string;
      };

export const startPolling = (
    key: `${PollingKeyPrefix}/${string}`,
    pollingFunction: () => void,
    pollingIntervalMs: number,
): PollingAction => ({
    type: POLLING.START,
    key,
    pollingFunction,
    pollingIntervalMs,
});

export const request = (key: string): PollingAction => ({
    type: POLLING.REQUEST,
    key,
});

export const stopPolling = (key: string): PollingAction => ({
    type: POLLING.STOP,
    key,
});
