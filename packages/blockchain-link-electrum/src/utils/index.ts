import type { Response } from '@trezor/blockchain-link-types/src';
import type { ElectrumAPI } from '@trezor/blockchain-link-types/src/electrum';
import type { AddressCache } from '@trezor/utxo-lib';

export * from './addressManager';
export * from './discovery';
export * from './transform';
export * from './transaction';

export type Api<M, R extends Omit<Response, 'id'>> = M extends { payload: any }
    ? (
          context: { client: ElectrumAPI; addressCache: AddressCache },
          params: M['payload'],
      ) => Promise<R['payload']>
    : (client: ElectrumAPI) => Promise<R['payload']>;
