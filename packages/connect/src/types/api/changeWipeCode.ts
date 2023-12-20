import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';

export declare function changeWipeCode(
    params: Params<PROTO.ChangeWipeCode>,
): Response<PROTO.Success>;
