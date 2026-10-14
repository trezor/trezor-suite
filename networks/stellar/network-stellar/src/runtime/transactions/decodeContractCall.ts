import { Address, scValToNative, xdr } from '@stellar/stellar-sdk';

import { isNotUndefined } from '@trezor/utils';

import type {
    StellarAuthorizedCallData,
    StellarContractCallArgument,
    StellarContractCallData,
} from '../../types/contractCall';

/** A contract argument in a shape the UI can render; addresses stay distinguishable from text. */
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

// Display must not fail on a symbol that is not valid UTF-8, so it falls back to hex.
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

    // A deployment node has no call to show; keeping its sub-calls would reparent them.
    if (authorizedFunction.type !== 'sorobanAuthorizedFunctionTypeContractFn') {
        return undefined;
    }

    return {
        ...decodeInvokeContractArgs(authorizedFunction.contractFn),
        subCalls: invocation.subInvocations.map(decodeAuthorizedCall).filter(isNotUndefined),
    };
};

const toDisplayArgument = (value: StellarScValue): StellarContractCallArgument =>
    value.type === 'address'
        ? { kind: value.isContract ? 'contract' : 'account', value: value.value }
        : { kind: 'text', value: formatScValue(value) };

const flattenAuthorizedCalls = (
    calls: StellarAuthorizedCall[],
    depth: number,
): StellarAuthorizedCallData[] =>
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
 * Reads the Soroban call out of the envelope XDR, which is self-describing enough to decode without
 * a contract ABI; Horizon itself reports only the resulting balance changes.
 */
export const decodeSorobanInvocation = (
    envelopeXdr: string,
): StellarContractCallData | undefined => {
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
