import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';

export declare function getFirmwareHash(
    params: Params<PROTO.GetFirmwareHash>,
): Response<PROTO.FirmwareHash>;
