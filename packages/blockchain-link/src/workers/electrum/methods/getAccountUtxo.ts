import type {
    MessageTypes,
    ResponseTypes,
    ElectrumUtxo as Utxo,
} from '@trezor/blockchain-link-types';
import { throwError } from '@trezor/utils';
import { discovery } from '@trezor/utxo-lib';

import { type Api, discoverAddress, tryGetScripthash } from '../utils';

type Req = MessageTypes.GetAccountUtxo;
type Res = ResponseTypes.GetAccountUtxo;

// The `blockchain.scripthash.listunspent` response is raw JSON-RPC data from a user-selectable
// (and MITM-able) Electrum server and is not runtime-validated. A non-array response makes the
// bare `.map` below throw, and a record with a missing `value` makes `value.toString()` (in
// transformUtxo) throw — either aborts the whole getAccountUtxo request, so a single poison record
// would drop *all* of the account's spendable UTXOs and block sending. Coerce to an array and drop
// malformed records at this untrusted-data boundary so the valid UTXOs still load.
export const sanitizeUtxos = (utxos: unknown): Utxo[] =>
    Array.isArray(utxos)
        ? utxos.filter(
              (u): u is Utxo =>
                  u != null &&
                  typeof u === 'object' &&
                  (u as Utxo).value != null &&
                  (u as Utxo).tx_hash != null,
          )
        : [];

const transformUtxo =
    (currentHeight: number, addressInfo: { address?: string; path?: string } = {}) =>
    ({ height, tx_hash, tx_pos, value }: Utxo): Res['payload'][number] => ({
        txid: tx_hash,
        vout: tx_pos,
        amount: value.toString(),
        address: '',
        path: '',
        ...addressInfo,
        ...(height
            ? {
                  blockHeight: height,
                  confirmations: currentHeight - height + 1,
              }
            : {
                  blockHeight: -1,
                  confirmations: 0,
              }),
    });

const getAccountUtxo: Api<Req, Res> = async ({ client, addressCache }, descriptor) => {
    const {
        block: { height },
        network,
    } = client.getInfo() || throwError('Client not initialized');

    const parsed = tryGetScripthash(descriptor, network);

    if (parsed.valid) {
        const utxos = await client.request('blockchain.scripthash.listunspent', parsed.scripthash);

        return sanitizeUtxos(utxos).map(transformUtxo(height));
    }

    const discover = discoverAddress(client);
    const receive = await discovery(discover, addressCache(descriptor, 'receive'));
    const change = await discovery(discover, addressCache(descriptor, 'change'));
    const result = await Promise.all(
        receive
            .concat(change)
            .filter(a => a.history.length)
            .map(({ address, path, scripthash }) =>
                client
                    .request('blockchain.scripthash.listunspent', scripthash)
                    .then(utxos =>
                        sanitizeUtxos(utxos).map(transformUtxo(height, { address, path })),
                    ),
            ),
    ).then(res => res.flat());

    return result;
};

export default getAccountUtxo;
