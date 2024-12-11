import { PROTO } from '../../constants';
import { Params, Response } from '../params';

export declare function nostrSignEvent(
    params: Params<PROTO.NostrSignEvent>,
): Response<PROTO.NostrEventSignature>;
