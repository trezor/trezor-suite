import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function getFirmwareHash(
    params: Params<PROTO.GetFirmwareHash>,
): Response<PROTO.FirmwareHash>;
