/**
 * Bitcoin and Bitcoin-like
 * Display requested address derived by given BIP32 path on device and
 * returns it to caller. User is asked to confirm the export on Trezor.
 */

import type { Messages } from '@trezor/transport';
import type {
    GetAddress as GetAddressShared,
    Address as AddressShared,
    Params,
    BundledParams,
    Response,
    BundledResponse,
} from '../params';

export interface GetAddress extends GetAddressShared {
    coin?: string;
    crossChain?: boolean;
    multisig?: Messages.MultisigRedeemScriptType;
    scriptType?: Messages.InternalInputScriptType;
}

export type Address = AddressShared & Messages.Address;

export declare function getAddress(params: Params<GetAddress>): Response<Address>;
export declare function getAddress(params: BundledParams<GetAddress>): BundledResponse<Address>;
