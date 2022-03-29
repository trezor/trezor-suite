/**
 * Get static coin info
 */
import type { Response } from '../params';
import type { CoinInfo } from '../coinInfo';

export interface GetCoinInfo {
    coin: string;
}

export declare function getCoinInfo(params: GetCoinInfo): Response<CoinInfo>;
