import { type TronCalldata } from '@trezor/calldata';

import { Calldata } from './calldata/calldata';

export const getTronCalldata = (): TronCalldata => Calldata;
