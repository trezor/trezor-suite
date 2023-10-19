import type { PROTO } from '../../constants';
import type { Params, Response, DerivationPath } from '../params';

export interface UnlockPathParams {
    path: DerivationPath;
    mac?: string;
}

export declare function unlockPath(params: Params<UnlockPathParams>): Response<PROTO.UnlockPath>;
