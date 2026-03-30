import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function backupDevice(params?: Params<PROTO.BackupDevice>): Response<PROTO.Success>;
