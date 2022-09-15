import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';

export interface UnlockPathParams {
    path: string | number[];
    mac?: string;
}

export declare function unlockPath(params: Params<UnlockPathParams>): Response<PROTO.UnlockPath>;
