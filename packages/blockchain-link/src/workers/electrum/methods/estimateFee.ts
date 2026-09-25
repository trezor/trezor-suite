import type { MessageTypes, ResponseTypes } from '@trezor/blockchain-link-types';

import { type Api, btcToSat } from '../utils';

type Req = MessageTypes.EstimateFee;
type Res = ResponseTypes.EstimateFee;

// `blockchainEstimateFee` (packages/connect/src/api/blockchainEstimateFee.ts) allows a caller to omit
// `request.blocks` entirely and calls `backend.estimateFee(request || {})` directly — bypassing the
// "smart" fee-levels loader, which always supplies an explicit `blocks` array. Without a fallback here,
// an absent `blocks` silently produced an empty result (no fee data, no error), unlike the ripple handler's
// equivalent path, which falls back to a single sensible entry. 2 blocks (~20 min confirmation target) is
// used as that same single-entry fallback.
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
