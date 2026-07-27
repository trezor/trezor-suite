import type { MessageTypes, ResponseTypes } from '@trezor/blockchain-link-types';

import { type Api, btcToSat } from '../utils';

type Req = MessageTypes.EstimateFee;
type Res = ResponseTypes.EstimateFee;

const estimateFee: Api<Req, Res> = ({ client }, payload) =>
    Promise.all(
        (payload.blocks || []).map(num =>
            client
                .request('blockchain.estimatefee', num)
                .then(btc => ({ feePerUnit: btcToSat(btc) })),
        ),
    );

export default estimateFee;
