import type { CommonParams, Response } from '../params';
import type { CoinInfo } from '../coinInfo';

export declare function getCoinInfo(params: CommonParams & { coin: string }): Response<CoinInfo>;
