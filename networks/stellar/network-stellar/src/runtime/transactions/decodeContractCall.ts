import { Address, scValToNative, xdr } from '@stellar/stellar-sdk';

import { isNotUndefined } from '@trezor/utils';

/**
 * A contract argument in a shape the UI can render. `scValToNative` collapses addresses, symbols
 * and strings into indistinguishable JS strings, and the UI has to tell an address, which links to
 * the explorer, from a plain label.
 */
export type StellarScValue =
    | { type: 'bool'; value: boolean }
    | { type: 'void' }
    | { type: 'integer'; value: string }
    | { type: 'bytes'; value: string }
    | { type: 'string'; value: string }
    | { type: 'symbol'; value: string }
    | { type: 'address'; value: string; isContract: boolean }
    | { type: 'vec'; items: StellarScValue[] }
    | { type: 'map'; entries: { key: StellarScValue; value: StellarScValue }[] }
    | { type: 'unsupported'; name: string };

export type StellarContractCall = {
    contractId: string;
    functionName: string;
    args: StellarScValue[];
};

/** A node of the authorization tree: a call plus the calls it in turn authorizes. */
export type StellarAuthorizedCall = StellarContractCall & {
    subCalls: StellarAuthorizedCall[];
};

/**
 * Mirrors `StellarContractCallData` in `@trezor/blockchain-link-types`. Arguments are rendered here
 * because only this module knows the XDR value types, and `blockchain-link-utils`, which assembles
 * the transaction synchronously, must not pull stellar-sdk in eagerly. `kind` separates an account
 * from a contract, which live under different explorer paths.
 */
type StellarDisplayArgument = { kind: 'account' | 'contract' | 'text'; value: string };

/** One authorization-tree node, flattened. Mirrors `StellarAuthorizedCallData`. */
type StellarAuthorizedCallInfo = {
    contractId: string;
    functionName: string;
    depth: number;
    args: StellarDisplayArgument[];
};

export type StellarContractCallInfo = {
    contractId: string;
    functionName: string;
    args: StellarDisplayArgument[];
    authorizedCalls: StellarAuthorizedCallInfo[];
};

// The signing path rejects a symbol or string that is not valid UTF-8; display must not fail, so it
// falls back to hex. `XdrString.toString()` substitutes U+FFFD for the bytes it cannot decode.
const readText = (value: xdr.XdrString): string => {
    const decoded = value.asStringOrBytes();

    return typeof decoded === 'string' ? decoded : Buffer.from(decoded).toString('hex');
};

const decodeAddress = (address: xdr.ScAddress): StellarScValue => {
    try {
        return {
            type: 'address',
            value: Address.fromScAddress(address).toString(),
            isContract: address.type === 'scAddressTypeContract',
        };
    } catch {
        // Claimable-balance and liquidity-pool addresses have no string form in stellar-sdk 17.
        return { type: 'unsupported', name: address.type };
    }
};

const decodeScValue = (scVal: xdr.ScVal): StellarScValue => {
    switch (scVal.type) {
        case 'scvBool':
            return { type: 'bool', value: scVal.b };
        case 'scvVoid':
            return { type: 'void' };
        case 'scvU32':
        case 'scvI32':
        case 'scvU64':
        case 'scvI64':
        case 'scvTimepoint':
        case 'scvDuration':
        case 'scvU128':
        case 'scvI128':
        case 'scvU256':
        case 'scvI256':
            // The wider integers are split into words in XDR; scValToNative reassembles them.
            return { type: 'integer', value: scValToNative(scVal).toString() };
        case 'scvBytes':
            return { type: 'bytes', value: Buffer.from(scVal.bytes.value).toString('hex') };
        case 'scvString':
            return { type: 'string', value: readText(scVal.str) };
        case 'scvSymbol':
            return { type: 'symbol', value: readText(scVal.sym) };
        case 'scvAddress':
            return decodeAddress(scVal.address);
        case 'scvVec':
            return { type: 'vec', items: (scVal.vec ?? []).map(decodeScValue) };
        case 'scvMap':
            return {
                type: 'map',
                entries: (scVal.map ?? []).map(entry => ({
                    key: decodeScValue(entry.key),
                    value: decodeScValue(entry.val),
                })),
            };
        default:
            return { type: 'unsupported', name: scVal.type };
    }
};

const formatScValue = (value: StellarScValue): string => {
    switch (value.type) {
        case 'bool':
            return value.value ? 'true' : 'false';
        case 'void':
            return 'void';
        case 'integer':
        case 'string':
        case 'symbol':
        case 'address':
            return value.value;
        case 'bytes':
            return `0x${value.value}`;
        case 'vec':
            return `[${value.items.map(formatScValue).join(', ')}]`;
        case 'map':
            return `{${value.entries
                .map(entry => `${formatScValue(entry.key)}: ${formatScValue(entry.value)}`)
                .join(', ')}}`;
        case 'unsupported':
            return value.name;
    }
};

const decodeInvokeContractArgs = (args: xdr.InvokeContractArgs): StellarContractCall => ({
    contractId: Address.fromScAddress(args.contractAddress).toString(),
    functionName: readText(args.functionName),
    args: args.args.map(decodeScValue),
});

const decodeAuthorizedCall = (
    invocation: xdr.SorobanAuthorizedInvocation,
): StellarAuthorizedCall | undefined => {
    const authorizedFunction = invocation.function;

    // A node authorizing a contract deployment carries no call to show. Keeping its sub-calls
    // without it would reparent them under the wrong caller, so the whole subtree is dropped.
    if (authorizedFunction.type !== 'sorobanAuthorizedFunctionTypeContractFn') {
        return undefined;
    }

    return {
        ...decodeInvokeContractArgs(authorizedFunction.contractFn),
        subCalls: invocation.subInvocations.map(decodeAuthorizedCall).filter(isNotUndefined),
    };
};

const toDisplayArgument = (value: StellarScValue): StellarContractCallInfo['args'][number] =>
    value.type === 'address'
        ? { kind: value.isContract ? 'contract' : 'account', value: value.value }
        : { kind: 'text', value: formatScValue(value) };

const flattenAuthorizedCalls = (
    calls: StellarAuthorizedCall[],
    depth: number,
): StellarContractCallInfo['authorizedCalls'] =>
    calls.flatMap(({ contractId, functionName, args, subCalls }) => [
        { contractId, functionName, depth, args: args.map(toDisplayArgument) },
        ...flattenAuthorizedCalls(subCalls, depth + 1),
    ]);

const readInnerTransaction = (envelope: xdr.TransactionEnvelope) => {
    switch (envelope.type) {
        case 'envelopeTypeTx':
            return envelope.v1.tx;
        case 'envelopeTypeTxFeeBump':
            return envelope.feeBump.tx.innerTx.v1.tx;
        default:
            // envelopeTypeTxV0 predates Soroban, so it never carries a host function.
            return undefined;
    }
};

/**
 * Reads the contract call a Soroban transaction performs out of its envelope XDR: of a host
 * function Horizon reports only the resulting balance changes, while the function name, its
 * arguments and the authorization tree live in the envelope, which is self-describing enough to
 * decode without a contract ABI. The protocol allows one Soroban operation per transaction, so the
 * one found here needs no index matching against Horizon's operation record.
 */
export const decodeSorobanInvocation = (
    envelopeXdr: string,
): StellarContractCallInfo | undefined => {
    try {
        const innerTx = readInnerTransaction(
            xdr.TransactionEnvelope.fromXdr(envelopeXdr, 'base64'),
        );
        const operation = innerTx?.operations.find(
            candidate => candidate.body.type === 'invokeHostFunction',
        );

        // `find` does not narrow its result, so the arm is re-checked before it is read.
        if (operation?.body.type !== 'invokeHostFunction') return undefined;

        const hostFunctionOp = operation.body.invokeHostFunctionOp;
        const { hostFunction } = hostFunctionOp;

        // Contract uploads and deployments have no arguments worth showing.
        if (hostFunction.type !== 'hostFunctionTypeInvokeContract') return undefined;

        const call = decodeInvokeContractArgs(hostFunction.invokeContract);
        const authorizedCalls = hostFunctionOp.auth
            .map(entry => decodeAuthorizedCall(entry.rootInvocation))
            .filter(isNotUndefined);

        return {
            contractId: call.contractId,
            functionName: call.functionName,
            args: call.args.map(toDisplayArgument),
            authorizedCalls: flattenAuthorizedCalls(authorizedCalls, 0),
        };
    } catch {
        // Display data only: an unreadable envelope must not drop the transaction from the history.
        return undefined;
    }
};
