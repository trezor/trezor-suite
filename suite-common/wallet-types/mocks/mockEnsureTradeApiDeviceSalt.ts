import { type EnsureTradeApiDeviceSaltDep } from '../src';

export const mockEnsureTradeApiDeviceSalt =
    (): EnsureTradeApiDeviceSaltDep['ensureTradeApiDeviceSalt'] => () =>
        Promise.resolve();
