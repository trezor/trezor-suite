import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';
import type { BinanceSignTransaction } from './binance';

export declare function binanceSignTransaction(
    params: Params<BinanceSignTransaction>,
): Response<PROTO.BinanceSignedTx>;
