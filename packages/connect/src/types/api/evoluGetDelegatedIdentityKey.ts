import { PROTO } from '../../constants';
import { Params, Response } from '../params';

export declare function evoluGetDelegatedIdentityKey(
    params: Params<{
        thp?: {
            staticHostKey: string;
            credential: string;
        };
    }>,
): Response<PROTO.EvoluDelegatedIdentityKey>;
