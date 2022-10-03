/**
 * Show a "Do not disconnect" dialog instead of the standard homescreen.
 */

import type { PROTO } from '../../constants';
import type { CommonParams, Response } from '../params';

export declare function setBusy(params: CommonParams & PROTO.SetBusy): Response<PROTO.Success>;
