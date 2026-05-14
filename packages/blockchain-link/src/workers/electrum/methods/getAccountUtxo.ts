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

        return utxos.map(transformUtxo(height));
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
                    .then(utxos => utxos.map(transformUtxo(height, { address, path }))),
            ),
    ).then(res => res.flat());

    return result;
};

export default getAccountUtxo;
