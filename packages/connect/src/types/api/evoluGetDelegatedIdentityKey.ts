import type { PROTO } from '../../constants';
import type { CommonParams, Params, Response } from '../params';

export declare function evoluGetDelegatedIdentityKey(
    params: Params<CommonParams>,
): Response<PROTO.EvoluDelegatedIdentityKey>;
