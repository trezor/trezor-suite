import { Api, btcToSat } from '../utils';
import type { EstimateFee as Req } from '@trezor/blockchain-link-types/src/messages';
import type { EstimateFee as Res } from '@trezor/blockchain-link-types/src/responses';

const estimateFee: Api<Req, Res> = (client, payload) =>
    Promise.all(
        (payload.blocks || []).map(num =>
            client
                .request('blockchain.estimatefee', num)
                .then(btc => ({ feePerUnit: btcToSat(btc) })),
        ),
    );

export default estimateFee;
