import type { CoinInfo } from '../coinInfo';
import type { CommonParams, Response } from '../params';

export declare function getCoinInfo(params: CommonParams & { coin: string }): Response<CoinInfo>;
