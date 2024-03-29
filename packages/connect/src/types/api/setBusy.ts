/**
 * Show a "Do not disconnect" dialog instead of the standard homescreen.
 */

import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';

export declare function setBusy(params: Params<PROTO.SetBusy>): Response<PROTO.Success>;
