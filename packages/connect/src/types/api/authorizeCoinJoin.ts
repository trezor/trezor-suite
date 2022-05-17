import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';

export interface AuthorizeCoinJoin {
    path: string | number[];
    coordinator: string;
    maxRounds: number;
    maxCoordinatorFeeRate: number;
    maxFeePerKvbyte: number;
    coin?: string;
    scriptType?: PROTO.InternalInputScriptType;
    amountUnit?: PROTO.AmountUnit;
}

export declare function authorizeCoinJoin(
    params: Params<AuthorizeCoinJoin>,
): Response<PROTO.Success>;
