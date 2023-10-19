import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';

interface CancelCoinjoinAuthorization {
    preauthorized?: boolean;
}

export declare function cancelCoinjoinAuthorization(
    params: Params<CancelCoinjoinAuthorization>,
): Response<PROTO.Success>;
