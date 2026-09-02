import { Address, type Operation, type xdr } from '@stellar/stellar-sdk';

/**
 * Maps the raw XDR of a Soroban `invokeHostFunction` operation onto the plain-JSON shape of the
 * device messages (`StellarInvokeHostFunctionOp` and friends in `messages-stellar.proto`).
 *
 * The rest of `transformTransaction` can work off stellar-sdk's decoded operation objects, but
 * Soroban is decoded as raw `xdr.*` instances, so every field has to be read through its accessor.
 * Types below mirror the proto messages; the schemas in `@trezor/connect-common` validate the
 * result against the real ones before it reaches the device.
 */

// StellarSCValType in messages-stellar.proto. The XDR enum is wider than the device supports:
// SCV_ERROR and the ledger-key/contract-instance variants have no proto counterpart.
const SC_VAL_TYPE = {
    scvBool: 0,
    scvVoid: 1,
    scvU32: 3,
    scvI32: 4,
    scvU64: 5,
    scvI64: 6,
    scvTimepoint: 7,
    scvDuration: 8,
    scvU128: 9,
    scvI128: 10,
    scvU256: 11,
    scvI256: 12,
    scvBytes: 13,
    scvString: 14,
    scvSymbol: 15,
    scvVec: 16,
    scvMap: 17,
    scvAddress: 18,
} as const;

const HOST_FUNCTION_TYPE_INVOKE_CONTRACT = 0;
const SOROBAN_AUTHORIZED_FUNCTION_TYPE_CONTRACT_FN = 0;
const SOROBAN_CREDENTIALS_SOURCE_ACCOUNT = 0;
const SOROBAN_CREDENTIALS_ADDRESS_V2 = 2;

export type StellarSCVal = {
    type: number;
    b?: boolean;
    u32?: number;
    i32?: number;
    u64?: string;
    i64?: string;
    timepoint?: string;
    duration?: string;
    u128?: { hi: string; lo: string };
    i128?: { hi: string; lo: string };
    u256?: { hi_hi: string; hi_lo: string; lo_hi: string; lo_lo: string };
    i256?: { hi_hi: string; hi_lo: string; lo_hi: string; lo_lo: string };
    bytes?: string;
    string?: string;
    symbol?: string;
    vec?: StellarSCVal[];
    map?: { key: StellarSCVal; value: StellarSCVal }[];
    address?: string;
};

export type StellarInvokeContractArgs = {
    contract_address: string;
    function_name: string;
    args: StellarSCVal[];
};

export type StellarSorobanAuthorizedInvocation = {
    function: { type: number; contract_fn?: StellarInvokeContractArgs };
    sub_invocations: StellarSorobanAuthorizedInvocation[];
};

export type StellarSorobanAuthorizationEntry = {
    credentials: {
        type: number;
        address_v2?: {
            address: string;
            nonce: string;
            signature_expiration_ledger: number;
            signature: StellarSCVal;
        };
    };
    root_invocation: StellarSorobanAuthorizedInvocation;
};

export type StellarInvokeHostFunctionOperation = {
    type: 'invokeHostFunction';
    source?: string;
    function: { type: number; invoke_contract?: StellarInvokeContractArgs };
    auth: StellarSorobanAuthorizationEntry[];
};

const unsupported = (what: string) =>
    new Error(`Unsupported Soroban ${what}. Only plain contract invocations can be signed.`);

// XDR strings and symbols are opaque bytes; the device message carries text. A value that does not
// survive the round trip would be re-encoded into a different transaction than the one signed.
const readText = (value: string | Buffer, field: string) => {
    if (typeof value === 'string') return value;

    const text = value.toString('utf8');
    if (!Buffer.from(text, 'utf8').equals(value)) {
        throw new Error(`Soroban ${field} is not valid UTF-8`);
    }

    return text;
};

const readAddress = (address: xdr.ScAddress) => {
    const { name } = address.switch();
    if (name !== 'scAddressTypeAccount' && name !== 'scAddressTypeContract') {
        throw unsupported(`address type: ${name}`);
    }

    return Address.fromScAddress(address).toString();
};

export const xdrScValToProto = (scVal: xdr.ScVal): StellarSCVal => {
    const { name } = scVal.switch();

    switch (name) {
        case 'scvBool':
            return { type: SC_VAL_TYPE.scvBool, b: scVal.b() };
        case 'scvVoid':
            return { type: SC_VAL_TYPE.scvVoid };
        case 'scvU32':
            return { type: SC_VAL_TYPE.scvU32, u32: scVal.u32() };
        case 'scvI32':
            return { type: SC_VAL_TYPE.scvI32, i32: scVal.i32() };
        case 'scvU64':
            return { type: SC_VAL_TYPE.scvU64, u64: scVal.u64().toString() };
        case 'scvI64':
            return { type: SC_VAL_TYPE.scvI64, i64: scVal.i64().toString() };
        case 'scvTimepoint':
            return { type: SC_VAL_TYPE.scvTimepoint, timepoint: scVal.timepoint().toString() };
        case 'scvDuration':
            return { type: SC_VAL_TYPE.scvDuration, duration: scVal.duration().toString() };
        case 'scvU128': {
            const parts = scVal.u128();

            return {
                type: SC_VAL_TYPE.scvU128,
                u128: { hi: parts.hi().toString(), lo: parts.lo().toString() },
            };
        }
        case 'scvI128': {
            const parts = scVal.i128();

            return {
                type: SC_VAL_TYPE.scvI128,
                i128: { hi: parts.hi().toString(), lo: parts.lo().toString() },
            };
        }
        case 'scvU256': {
            const parts = scVal.u256();

            return {
                type: SC_VAL_TYPE.scvU256,
                u256: {
                    hi_hi: parts.hiHi().toString(),
                    hi_lo: parts.hiLo().toString(),
                    lo_hi: parts.loHi().toString(),
                    lo_lo: parts.loLo().toString(),
                },
            };
        }
        case 'scvI256': {
            const parts = scVal.i256();

            return {
                type: SC_VAL_TYPE.scvI256,
                i256: {
                    hi_hi: parts.hiHi().toString(),
                    hi_lo: parts.hiLo().toString(),
                    lo_hi: parts.loHi().toString(),
                    lo_lo: parts.loLo().toString(),
                },
            };
        }
        case 'scvBytes':
            return { type: SC_VAL_TYPE.scvBytes, bytes: scVal.bytes().toString('hex') };
        case 'scvString':
            return { type: SC_VAL_TYPE.scvString, string: readText(scVal.str(), 'string') };
        case 'scvSymbol':
            return { type: SC_VAL_TYPE.scvSymbol, symbol: readText(scVal.sym(), 'symbol') };
        case 'scvVec':
            return { type: SC_VAL_TYPE.scvVec, vec: (scVal.vec() ?? []).map(xdrScValToProto) };
        case 'scvMap':
            return {
                type: SC_VAL_TYPE.scvMap,
                map: (scVal.map() ?? []).map(entry => ({
                    key: xdrScValToProto(entry.key()),
                    value: xdrScValToProto(entry.val()),
                })),
            };
        case 'scvAddress':
            return { type: SC_VAL_TYPE.scvAddress, address: readAddress(scVal.address()) };
        default:
            throw unsupported(`value type: ${name}`);
    }
};

const xdrInvokeContractArgsToProto = (args: xdr.InvokeContractArgs): StellarInvokeContractArgs => ({
    contract_address: readAddress(args.contractAddress()),
    function_name: readText(args.functionName(), 'function name'),
    args: args.args().map(xdrScValToProto),
});

export const xdrHostFunctionToProto = (hostFunction: xdr.HostFunction) => {
    const { name } = hostFunction.switch();
    if (name !== 'hostFunctionTypeInvokeContract') {
        throw unsupported(`host function: ${name}`);
    }

    return {
        type: HOST_FUNCTION_TYPE_INVOKE_CONTRACT,
        invoke_contract: xdrInvokeContractArgsToProto(hostFunction.invokeContract()),
    };
};

const xdrInvocationToProto = (
    invocation: xdr.SorobanAuthorizedInvocation,
): StellarSorobanAuthorizedInvocation => {
    const authorizedFunction = invocation.function();
    const { name } = authorizedFunction.switch();
    if (name !== 'sorobanAuthorizedFunctionTypeContractFn') {
        throw unsupported(`authorized function: ${name}`);
    }

    return {
        function: {
            type: SOROBAN_AUTHORIZED_FUNCTION_TYPE_CONTRACT_FN,
            contract_fn: xdrInvokeContractArgsToProto(authorizedFunction.contractFn()),
        },
        sub_invocations: invocation.subInvocations().map(xdrInvocationToProto),
    };
};

const xdrCredentialsToProto = (credentials: xdr.SorobanCredentials) => {
    const { name } = credentials.switch();

    if (name === 'sorobanCredentialsSourceAccount') {
        return { type: SOROBAN_CREDENTIALS_SOURCE_ACCOUNT };
    }

    if (name !== 'sorobanCredentialsAddressV2') {
        throw unsupported(`authorization credentials: ${name}`);
    }

    const address = credentials.addressV2();
    const signature = address.signature();

    // An unsigned entry is the dApp asking us to authorize the invocation itself, which needs the
    // separate StellarSignSorobanAuthorization flow the device offers. Signing the transaction
    // would produce an envelope the network rejects, so say what is missing instead.
    if (signature.switch().name === 'scvVoid') {
        throw new Error(
            'Soroban authorization entry is unsigned. Signing authorization entries is not supported yet.',
        );
    }

    return {
        type: SOROBAN_CREDENTIALS_ADDRESS_V2,
        address_v2: {
            address: readAddress(address.address()),
            nonce: address.nonce().toString(),
            signature_expiration_ledger: address.signatureExpirationLedger(),
            signature: xdrScValToProto(signature),
        },
    };
};

export const xdrAuthEntryToProto = (
    entry: xdr.SorobanAuthorizationEntry,
): StellarSorobanAuthorizationEntry => ({
    credentials: xdrCredentialsToProto(entry.credentials()),
    root_invocation: xdrInvocationToProto(entry.rootInvocation()),
});

export const transformInvokeHostFunctionOperation = (
    operation: Operation.InvokeHostFunction,
): StellarInvokeHostFunctionOperation => ({
    type: 'invokeHostFunction',
    source: operation.source,
    function: xdrHostFunctionToProto(operation.func),
    auth: (operation.auth ?? []).map(xdrAuthEntryToProto),
});
