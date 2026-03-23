import { Static } from '@trezor/schema-utils';
import { PROTO } from '../../../constants';
import { Params, Response, GetPublicKey } from '../../params';

export type NostrGetPublicKey = Static<typeof GetPublicKey>;
export const NostrGetPublicKey = GetPublicKey;

export declare function nostrGetPublicKey(
    params: Params<GetPublicKey>,
): Response<PROTO.NostrPubkey>;
