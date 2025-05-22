import { StaticSessionId } from '@trezor/connect';
import { Deferred } from '@trezor/utils';

// this object will hold a Promises for each currently running discovery, so that different parts of code can await it independently
// this was moved here from Redux because it mustn't hold a non-serializable value
export const discoveryRunningStateLocks: Record<StaticSessionId, Deferred<void>> = {};
