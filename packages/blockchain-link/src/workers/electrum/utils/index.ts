import type { Response } from '@trezor/blockchain-link-types/lib';
import type { ElectrumAPI } from '@trezor/blockchain-link-types/lib/electrum';

export * from './addressManager';
export * from './discovery';
export * from './transform';
export * from './transaction';

export type Api<M, R extends Omit<Response, 'id'>> = M extends { payload: any }
    ? (client: ElectrumAPI, params: M['payload']) => Promise<R['payload']>
    : (client: ElectrumAPI) => Promise<R['payload']>;
