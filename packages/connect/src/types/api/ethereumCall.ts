import type { CommonParamsWithCoin, Params, Response } from '../params';
import type { EthereumCall } from './ethereum';

export declare function ethereumCall(
    params: CommonParamsWithCoin & Params<EthereumCall>,
): Response<{ data: string }>;
