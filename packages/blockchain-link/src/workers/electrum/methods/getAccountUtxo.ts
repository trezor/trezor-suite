import { Api, tryGetScripthash, discovery, flatten, fail } from '../utils';
import type { GetAccountUtxo as Req } from '../../../types/messages';
import type { GetAccountUtxo as Res } from '../../../types/responses';
import type { Utxo } from '../../../types/electrum';

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

const getAccountUtxo: Api<Req, Res> = async (client, descriptor) => {
    const parsed = tryGetScripthash(descriptor, client.getInfo()?.network);
    const {
        block: { height },
    } = client.getInfo() || fail('Client not initialized');

    if (parsed.valid) {
        const utxos = await client.request('blockchain.scripthash.listunspent', parsed.scripthash);
        return utxos.map(transformUtxo(height));
    }

    const receive = await discovery(client, descriptor, 'receive');
    const change = await discovery(client, descriptor, 'change');
    const result = await Promise.all(
        receive
            .concat(change)
            .filter(a => a.history.length)
            .map(({ address, path, scripthash }) =>
                client
                    .request('blockchain.scripthash.listunspent', scripthash)
                    .then(utxos => utxos.map(transformUtxo(height, { address, path })))
            )
    ).then(flatten);
    return result;
};

export default getAccountUtxo;
