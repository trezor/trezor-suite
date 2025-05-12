import { Nonce } from '@trezor/protobuf/src/messages';

import { CommonParams, Response } from '../params';

export declare function getNonce(params?: CommonParams): Response<Nonce>;
