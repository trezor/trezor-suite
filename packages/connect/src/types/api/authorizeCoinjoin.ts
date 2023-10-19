import type { PROTO } from '../../constants';
import type { Params, Response, DerivationPath } from '../params';

export interface AuthorizeCoinjoin {
    path: DerivationPath;
    coordinator: string;
    maxRounds: number;
    maxCoordinatorFeeRate: number;
    maxFeePerKvbyte: number;
    coin?: string;
    scriptType?: PROTO.InternalInputScriptType;
    amountUnit?: PROTO.AmountUnit;
    preauthorized?: boolean;
}

export declare function authorizeCoinjoin(
    params: Params<AuthorizeCoinjoin>,
): Response<PROTO.Success>;
