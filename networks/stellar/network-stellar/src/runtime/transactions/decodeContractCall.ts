import { Address, scValToNative, xdr } from '@stellar/stellar-sdk';

import { isNotUndefined } from '@trezor/utils';

/**
 * A contract argument in a shape the UI can render. `scValToNative` is deliberately not used for
 * the whole value: it collapses addresses, symbols and strings into indistinguishable JS strings
 * and turns maps into plain objects, losing the key types, while the UI needs to tell an address
 * (which links to the explorer) from a plain label.
 */
export type StellarScValue =
    | { type: 'bool'; value: boolean }
    | { type: 'void' }
    | { type: 'integer'; value: string }
    | { type: 'bytes'; value: string }
    | { type: 'string'; value: string }
    | { type: 'symbol'; value: string }
    | { type: 'address'; value: string }
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
 * The invocation in the shape the account history carries. Arguments are rendered here because
 * only this module knows the XDR value types, and `blockchain-link-utils` — which assembles the
 * transaction — is synchronous and must not pull stellar-sdk in eagerly. Mirrors
 * `StellarContractCallData` in `@trezor/blockchain-link-types`.
 */
export type StellarContractCallInfo = {
    contractId: string;
    functionName: string;
    args: { kind: 'address' | 'text'; value: string }[];
    authorizedCalls: { contractId: string; functionName: string; depth: number }[];
};

// The signing path rejects a symbol or string that is not valid UTF-8, because re-encoding it would
// change the transaction. Display has no such constraint and must not fail, so it falls back to hex.
const readText = (value: string | Buffer): string => {
    if (typeof value === 'string') return value;

    const text = value.toString('utf8');

    return Buffer.from(text, 'utf8').equals(value) ? text : value.toString('hex');
};

const decodeAddress = (address: xdr.ScAddress): StellarScValue => {
    try {
        return { type: 'address', value: Address.fromScAddress(address).toString() };
    } catch {
        // Claimable-balance and liquidity-pool addresses have no string form in stellar-sdk 16.
        return { type: 'unsupported', name: address.switch().name };
    }
};

const decodeScValue = (scVal: xdr.ScVal): StellarScValue => {
    const { name } = scVal.switch();

    switch (name) {
        case 'scvBool':
            return { type: 'bool', value: scVal.b() };
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
            return { type: 'bytes', value: scVal.bytes().toString('hex') };
        case 'scvString':
            return { type: 'string', value: readText(scVal.str()) };
        case 'scvSymbol':
            return { type: 'symbol', value: readText(scVal.sym()) };
        case 'scvAddress':
            return decodeAddress(scVal.address());
        case 'scvVec':
            return { type: 'vec', items: (scVal.vec() ?? []).map(decodeScValue) };
        case 'scvMap':
            return {
                type: 'map',
                entries: (scVal.map() ?? []).map(entry => ({
                    key: decodeScValue(entry.key()),
                    value: decodeScValue(entry.val()),
                })),
            };
        default:
            return { type: 'unsupported', name };
    }
};

/** Renders a decoded argument as a single line of text, for arguments the UI shows verbatim. */
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
    contractId: Address.fromScAddress(args.contractAddress()).toString(),
    functionName: readText(args.functionName()),
    args: args.args().map(decodeScValue),
});

const decodeAuthorizedCall = (
    invocation: xdr.SorobanAuthorizedInvocation,
): StellarAuthorizedCall | undefined => {
    const authorizedFunction = invocation.function();

    // A node authorizing a contract deployment carries no call to show. Keeping its sub-calls
    // without it would reparent them under the wrong caller, so the whole subtree is dropped.
    if (authorizedFunction.switch().name !== 'sorobanAuthorizedFunctionTypeContractFn') {
        return undefined;
    }

    return {
        ...decodeInvokeContractArgs(authorizedFunction.contractFn()),
        subCalls: invocation.subInvocations().map(decodeAuthorizedCall).filter(isNotUndefined),
    };
};

const toDisplayArgument = (value: StellarScValue): StellarContractCallInfo['args'][number] =>
    value.type === 'address'
        ? { kind: 'address', value: value.value }
        : { kind: 'text', value: formatScValue(value) };

const flattenAuthorizedCalls = (
    calls: StellarAuthorizedCall[],
    depth: number,
): StellarContractCallInfo['authorizedCalls'] =>
    calls.flatMap(({ contractId, functionName, subCalls }) => [
        { contractId, functionName, depth },
        ...flattenAuthorizedCalls(subCalls, depth + 1),
    ]);

const readInnerTransaction = (envelope: xdr.TransactionEnvelope) => {
    switch (envelope.switch().name) {
        case 'envelopeTypeTx':
            return envelope.v1().tx();
        case 'envelopeTypeTxFeeBump':
            return envelope.feeBump().tx().innerTx().v1().tx();
        default:
            // envelopeTypeTxV0 predates Soroban, so it never carries a host function.
            return undefined;
    }
};

/**
 * Reads the contract call a Soroban transaction performs out of its envelope XDR. Horizon
 * pre-decodes classic operations, but of a host function it only reports the resulting asset
 * balance changes — the function name, its arguments and the authorization tree live in the
 * envelope. XDR is self-describing, so no contract ABI is needed to decode them.
 *
 * The protocol allows only one Soroban operation per transaction, which is why the host function
 * found here needs no index matching against the operation record Horizon returned.
 */
export const decodeSorobanInvocation = (
    envelopeXdr: string,
): StellarContractCallInfo | undefined => {
    try {
        const innerTx = readInnerTransaction(
            xdr.TransactionEnvelope.fromXDR(envelopeXdr, 'base64'),
        );
        // The accessors are prototype methods that read `this`, so they must stay bound.
        const operation = innerTx
            ?.operations()
            .find(candidate => candidate.body().switch().name === 'invokeHostFunction');

        if (!operation) return undefined;

        const hostFunctionOp = operation.body().invokeHostFunctionOp();
        const hostFunction = hostFunctionOp.hostFunction();

        // Contract uploads and deployments have no arguments worth showing.
        if (hostFunction.switch().name !== 'hostFunctionTypeInvokeContract') return undefined;

        const call = decodeInvokeContractArgs(hostFunction.invokeContract());
        const authorizedCalls = hostFunctionOp
            .auth()
            .map(entry => decodeAuthorizedCall(entry.rootInvocation()))
            .filter(isNotUndefined);

        return {
            contractId: call.contractId,
            functionName: call.functionName,
            args: call.args.map(toDisplayArgument),
            authorizedCalls: flattenAuthorizedCalls(authorizedCalls, 0),
        };
    } catch {
        // This is display data only: an envelope Suite cannot read must not drop the whole
        // transaction from the account history.
        return undefined;
    }
};
