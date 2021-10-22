import type { Response } from '../../../types';
import type { ElectrumAPI } from '../../../types/electrum';

export * from './addressManager';
export * from './derivation';
export * from './discovery';
export * from './transform';
export * from './transaction';
export * from './misc';

export type Api<M, R extends Omit<Response, 'id'>> = M extends { payload: any }
    ? (client: ElectrumAPI, params: M['payload']) => Promise<R['payload']>
    : (client: ElectrumAPI) => Promise<R['payload']>;
