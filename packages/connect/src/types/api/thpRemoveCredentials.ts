import type { ThpCredentials } from '@trezor/protocol';

import type { PROTO } from '../../constants';
import type { CommonParams, Response } from '../params';

export declare function thpRemoveCredentials(
    params: CommonParams & { credentials?: ThpCredentials[] },
): Response<PROTO.Success>;
