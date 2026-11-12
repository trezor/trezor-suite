import type { Nonce } from '@trezor/protobuf/definitions';

import type { CommonParams, Response } from '../../params';

export declare function getNonce(params?: CommonParams): Response<Nonce>;
