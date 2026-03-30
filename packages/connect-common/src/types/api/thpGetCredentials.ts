import type { ThpCredentials } from '@trezor/protocol';

import type { CommonParams, Response } from '../params';

export declare function thpGetCredentials(params?: CommonParams): Response<ThpCredentials>;
