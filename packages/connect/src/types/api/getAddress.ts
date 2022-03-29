import type { PROTO } from '../../constants';
import type {
    GetAddress as GetAddressShared,
    Address as AddressShared,
    Params,
    BundledParams,
    Response,
} from '../params';

interface GetAddress extends GetAddressShared {
    coin?: string;
    crossChain?: boolean;
    multisig?: PROTO.MultisigRedeemScriptType;
    scriptType?: PROTO.InternalInputScriptType;
}

type Address = AddressShared & PROTO.Address;

export declare function getAddress(params: Params<GetAddress>): Response<Address>;
export declare function getAddress(params: BundledParams<GetAddress>): Response<Address[]>;
