import type { MessageTypes, ResponseTypes } from '@trezor/blockchain-link-types';

import { type Api, btcToSat } from '../utils';

type Req = MessageTypes.EstimateFee;
type Res = ResponseTypes.EstimateFee;

// Connect permits an omitted blocks array (connect-core/src/api/blockchainEstimateFee.ts).
// Use a single two-block estimate instead of returning no fee data.
const DEFAULT_BLOCKS = [2];

const estimateFee: Api<Req, Res> = ({ client }, payload) =>
    Promise.all(
        (payload.blocks && payload.blocks.length > 0 ? payload.blocks : DEFAULT_BLOCKS).map(num =>
            client
                .request('blockchain.estimatefee', num)
                .then(btc => ({ feePerUnit: btcToSat(btc) })),
        ),
    );

export default estimateFee;
