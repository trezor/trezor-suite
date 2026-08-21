// Former connect-plugin-stellar

import {
    Address,
    Asset,
    Keypair,
    type Memo,
    MemoHash,
    MemoID,
    MemoReturn,
    MemoText,
    type Operation,
    type Signer,
    type Transaction,
    xdr,
} from '@stellar/stellar-sdk';

import { toStroops } from '../../constants';

// The protobuf Soroban enums mirror the Stellar XDR enums, so the XDR discriminant
// (`XxxType.fromName(x.type).value`) is used directly as the protobuf `type`.
//
// @stellar/stellar-sdk 17 rebuilt the xdr namespace: unions are now discriminated on a
// string `.type` (e.g. `'scvBool'`) rather than a `.switch()` accessor, and their arms are
// plain readonly properties (`val.u32`) instead of accessor methods (`val.u32()`). 64-bit
// integers surface as native `bigint`.

/**
 * Reads an SCAddress (account or contract) into its Stellar string form (G.../C...).
 */
const readScAddress = (address: xdr.ScAddress) => Address.fromScAddress(address).toString();

/**
 * Reads an SCVal from XDR into the protobuf StellarSCVal shape.
 * bytes-typed fields (bytes, string) are hex strings; 64-bit ints are decimal strings.
 */
const readScVal = (val: xdr.ScVal): any => {
    const type = xdr.ScValType.fromName(val.type).value;

    switch (val.type) {
        case 'scvBool':
            return { type, b: val.b };
        case 'scvVoid':
            return { type };
        case 'scvU32':
            return { type, u32: val.u32 };
        case 'scvI32':
            return { type, i32: val.i32 };
        case 'scvU64':
            return { type, u64: val.u64.toString() };
        case 'scvI64':
            return { type, i64: val.i64.toString() };
        case 'scvTimepoint':
            return { type, timepoint: val.timepoint.toString() };
        case 'scvDuration':
            return { type, duration: val.duration.toString() };
        case 'scvU128':
            return {
                type,
                u128: { hi: val.u128.hi.toString(), lo: val.u128.lo.toString() },
            };
        case 'scvI128':
            return {
                type,
                i128: { hi: val.i128.hi.toString(), lo: val.i128.lo.toString() },
            };
        case 'scvU256':
            return {
                type,
                u256: {
                    hi_hi: val.u256.hiHi.toString(),
                    hi_lo: val.u256.hiLo.toString(),
                    lo_hi: val.u256.loHi.toString(),
                    lo_lo: val.u256.loLo.toString(),
                },
            };
        case 'scvI256':
            return {
                type,
                i256: {
                    hi_hi: val.i256.hiHi.toString(),
                    hi_lo: val.i256.hiLo.toString(),
                    lo_hi: val.i256.loHi.toString(),
                    lo_lo: val.i256.loLo.toString(),
                },
            };
        case 'scvBytes':
            return { type, bytes: Buffer.from(val.bytes.value).toString('hex') };
        case 'scvString':
            // The bytes in an SCString are not necessarily valid UTF-8, so keep them as hex.
            return { type, string: Buffer.from(val.str.bytes).toString('hex') };
        case 'scvSymbol':
            return { type, symbol: val.sym.toString() };
        case 'scvVec': {
            const { vec } = val;
            // A null vector is not a valid Soroban value; rejecting it avoids signing bytes
            // that differ from the input XDR (the firmware always encodes the vector as present).
            if (!vec) {
                throw new Error('SCV_VEC with a null vector is not supported');
            }

            return { type, vec: vec.map(readScVal) };
        }
        case 'scvMap': {
            const { map } = val;
            if (!map) {
                throw new Error('SCV_MAP with a null map is not supported');
            }

            return {
                type,
                map: map.map(entry => ({
                    key: readScVal(entry.key),
                    value: readScVal(entry.val),
                })),
            };
        }
        case 'scvAddress':
            return { type, address: readScAddress(val.address) };
        default:
            throw new Error(`Unsupported SCVal type: ${val.type}`);
    }
};

/**
 * Reads InvokeContractArgs (contract address, function name and arguments) from XDR.
 */
const readInvokeContractArgs = (data: xdr.InvokeContractArgs) => ({
    contract_address: readScAddress(data.contractAddress),
    function_name: data.functionName.toString(),
    args: data.args.map(readScVal),
});

/**
 * Reads a HostFunction from XDR. Only the invoke-contract host function is supported.
 */
const readHostFunction = (hostFunction: xdr.HostFunction) => {
    if (hostFunction.type !== 'hostFunctionTypeInvokeContract') {
        throw new Error(`Unsupported host function type: ${hostFunction.type}`);
    }

    return {
        type: xdr.HostFunctionType.fromName(hostFunction.type).value,
        invoke_contract: readInvokeContractArgs(hostFunction.invokeContract),
    };
};

/**
 * Reads a SorobanAuthorizedFunction from XDR. Only the contract-fn variant is supported.
 */
const readAuthorizedFunction = (fn: xdr.SorobanAuthorizedFunction) => {
    if (fn.type !== 'sorobanAuthorizedFunctionTypeContractFn') {
        throw new Error(`Unsupported SorobanAuthorizedFunction type: ${fn.type}`);
    }

    return {
        type: xdr.SorobanAuthorizedFunctionType.fromName(fn.type).value,
        contract_fn: readInvokeContractArgs(fn.contractFn),
    };
};

/**
 * Reads a SorobanAuthorizedInvocation tree from XDR (recurses into sub-invocations).
 */
const readAuthorizedInvocation = (invocation: xdr.SorobanAuthorizedInvocation): any => ({
    function: readAuthorizedFunction(invocation.function),
    sub_invocations: invocation.subInvocations.map(readAuthorizedInvocation),
});

/**
 * Reads SorobanAddressCredentials from XDR.
 */
const readAddressCredentials = (credentials: xdr.SorobanAddressCredentials) => ({
    address: readScAddress(credentials.address),
    // Nonce is a random sint64; keep it as a string to preserve full precision.
    nonce: credentials.nonce.toString(),
    signature_expiration_ledger: credentials.signatureExpirationLedger,
    signature: readScVal(credentials.signature),
});

/**
 * Reads SorobanCredentials from XDR. Only source-account and address-v2 credentials are
 * supported; the legacy (to-be-deprecated) address credentials are intentionally rejected.
 */
const readCredentials = (credentials: xdr.SorobanCredentials) => {
    switch (credentials.type) {
        case 'sorobanCredentialsSourceAccount':
            return { type: xdr.SorobanCredentialsType.fromName(credentials.type).value };
        case 'sorobanCredentialsAddressV2':
            return {
                type: xdr.SorobanCredentialsType.fromName(credentials.type).value,
                address_v2: readAddressCredentials(credentials.addressV2),
            };
        default:
            throw new Error(`Unsupported SorobanCredentials type: ${credentials.type}`);
    }
};

/**
 * Reads a SorobanAuthorizationEntry from XDR.
 */
const readAuthorizationEntry = (entry: xdr.SorobanAuthorizationEntry) => ({
    credentials: readCredentials(entry.credentials),
    root_invocation: readAuthorizedInvocation(entry.rootInvocation),
});

/**
 * Transforms an InvokeHostFunction operation into the protobuf-shaped connect operation.
 */
const transformInvokeHostFunction = (op: Operation.InvokeHostFunction) => ({
    type: 'invokeHostFunction',
    source: op.source,
    function: readHostFunction(op.func),
    auth: (op.auth ?? []).map(readAuthorizationEntry),
});

/**
 * Transforms Signer to TrezorConnect.StellarTransaction.Signer
 */
const transformSigner = (signer: Signer) => {
    const { weight } = signer;

    if ('ed25519PublicKey' in signer) {
        const keyPair = Keypair.fromPublicKey(signer.ed25519PublicKey);
        const key = Buffer.from(keyPair.rawPublicKey()).toString('hex');

        return { type: 0, key, weight };
    }
    if ('preAuthTx' in signer) {
        const key = Buffer.from(signer.preAuthTx).toString('hex');

        return { type: 1, key, weight };
    }
    if ('sha256Hash' in signer) {
        const key = Buffer.from(signer.sha256Hash).toString('hex');

        return { type: 2, key, weight };
    }

    return { type: 0, key: undefined, weight };
};

/**
 * Transforms Asset to TrezorConnect.StellarTransaction.Asset
 */
const transformAsset = (asset: Asset) => {
    if (asset.isNative()) {
        return {
            type: 0,
            code: asset.getCode(),
        };
    }

    return {
        type: asset.getAssetType() === 'credit_alphanum4' ? 1 : 2,
        code: asset.getCode(),
        issuer: asset.getIssuer(),
    };
};

/**
 * Transforms Memo to TrezorConnect.StellarTransaction.Memo
 */
const transformMemo = (memo: Memo) => {
    // Memo<T>'s `value` getter type is keyed by T, but T isn't narrowed by switching on
    // `memo.type` here (it's a generic class, not a discriminated union), so `.value`'s static
    // type is still the full union across all memo types. Buffer.from()'s overloads don't accept
    // that union directly; the case-specific `as` casts below reflect the real runtime type for
    // each memo type (see stellar-sdk's own memo.d.ts).
    switch (memo.type) {
        case MemoText:
            return { type: 1, text: Buffer.from(memo.value! as Uint8Array).toString('utf-8') };
        case MemoID:
            // Memo.id's value is already a decimal string, not bytes
            return { type: 2, id: memo.value! as string };
        case MemoHash:
            // stringify is not necessary, Buffer is also accepted
            return { type: 3, hash: Buffer.from(memo.value! as Uint8Array).toString('hex') };
        case MemoReturn:
            // stringify is not necessary, Buffer is also accepted
            return { type: 4, hash: Buffer.from(memo.value! as Uint8Array).toString('hex') };
        default:
            return { type: 0 };
    }
};

/**
 * Transforms Transaction.timeBounds to TrezorConnect.StellarTransaction.timebounds
 */
const transformTimebounds = (timebounds: Transaction['timeBounds']) => {
    if (!timebounds) return undefined;

    // those values are defined in Trezor firmware messages as numbers
    return {
        minTime: Number.parseInt(timebounds.minTime, 10),
        maxTime: Number.parseInt(timebounds.maxTime, 10),
    };
};

/**
 * Transforms Transaction to TrezorConnect.StellarTransaction
 */
export const transformTransaction = (transaction: Transaction) => {
    const amounts = [
        'amount',
        'sendMax',
        'destAmount',
        'sendAmount',
        'destMin',
        'startingBalance',
        'limit',
        'buyAmount',
    ];
    const assets = ['asset', 'sendAsset', 'destAsset', 'selling', 'buying', 'line'];

    const operations = transaction.operations.map((o, i) => {
        // Soroban operations carry XDR structures that need bespoke handling, not the generic
        // asset/amount field processing below.
        if (o.type === 'invokeHostFunction') {
            return transformInvokeHostFunction(o);
        }

        const operation: any = { ...o };

        // stellar-sdk 16 returns null for absent optional setOptions fields; connect expects
        // them undefined (manageData keeps null — there it means removal of the entry)
        if (operation.type === 'setOptions') {
            Object.keys(operation).forEach(field => {
                if (operation[field] === null) {
                    delete operation[field];
                }
            });
        }

        // transform Signer
        if (operation.signer) {
            operation.signer = transformSigner(operation.signer);
        }

        // transform asset path
        if (operation.path) {
            operation.path = operation.path.map(transformAsset);
        }

        // transform "price" field to { n: number, d: number }
        // Note: @stellar/stellar-sdk 17 rebuilt the xdr namespace so union/struct fields
        // (body, value, price, n, d) are plain readonly properties, not accessor methods
        if (typeof operation.price === 'string') {
            const xdrOperationBody = transaction.tx.operations[i]?.body?.value;
            if (xdrOperationBody && 'price' in xdrOperationBody) {
                operation.price = {
                    n: xdrOperationBody.price.n,
                    d: xdrOperationBody.price.d,
                };
            }
        }

        // transform amounts
        amounts.forEach(field => {
            if (typeof operation[field] === 'string') {
                operation[field] = toStroops(operation[field]).toString();
            }
        });

        // transform assets
        assets.forEach(field => {
            if (operation[field]) {
                operation[field] = transformAsset(operation[field]);
            }
        });

        // add missing field
        if (operation.type === 'allowTrust') {
            const allowTrustAsset = new Asset(operation.assetCode, operation.trustor);
            operation.assetType = transformAsset(allowTrustAsset).type;
        }

        if (operation.type === 'manageData') {
            // stellar-sdk 17 returns undefined here for a "remove data" operation (no value =
            // delete the entry), where 16 returned null; normalize back to null so the
            // null-means-removal contract noted above (re: setOptions) still holds.
            // stringify is not necessary, Buffer is also accepted
            operation.value = operation.value ? Buffer.from(operation.value).toString('hex') : null;
        }
        if (operation.type === 'manageBuyOffer') {
            operation.amount = operation.buyAmount;
            delete operation.buyAmount;
        }
        operation.type = o.type;

        return operation;
    });

    // Soroban transactions carry a transaction extension (SorobanTransactionData) that the
    // device signs over; expose it as raw XDR (hex) for the StellarTxExt message. Only the v1
    // envelope (TransactionExt) has it; the legacy v0 envelope never does.
    const { ext } = transaction.tx;
    const sorobanData = ext.type === 'sorobanData' ? ext.sorobanData.toXdr('hex') : undefined;

    return {
        source: transaction.source,
        fee: Number.parseInt(transaction.fee, 10),
        sequence: transaction.sequence,
        memo: transformMemo(transaction.memo),
        timebounds: transformTimebounds(transaction.timeBounds),
        operations,
        ...(sorobanData && { sorobanData }),
    };
};
