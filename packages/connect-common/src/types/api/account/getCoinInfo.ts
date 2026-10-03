import type { CoinInfo } from '../../coinInfo';
import type { DeviceFreeCommonParams, Response } from '../../params';

export declare function getCoinInfo(
    params: DeviceFreeCommonParams & { coin: string },
): Response<CoinInfo>;
