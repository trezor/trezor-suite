import {
    Account,
    Address,
    BASE_FEE,
    Networks,
    Operation,
    SorobanDataBuilder,
    TransactionBuilder,
    nativeToScVal,
    xdr,
} from '@stellar/stellar-sdk';

import { transformTransaction } from './transform';

const SOURCE = 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH';
const HOLDER = 'GC2GT6BHYJUKD7SVAKXVLBYBCELCHY577CAXJM5QNVLERDGFF37LR35K';
const CONTRACT = 'CAS3FL6TLZKDGGSISDBWGGPXT3NRR4DYTZD7YOD3HMYO6LTJUVGRVEAM';
// larger than Number.MAX_SAFE_INTEGER, like a real Soroban replay-protection nonce
const NONCE = '7223372036854775807';

const contractArgs = (args: xdr.ScVal[] = []) =>
    new xdr.InvokeContractArgs({
        contractAddress: new Address(CONTRACT).toScAddress(),
        functionName: 'transfer',
        args,
    });

const rootInvocation = () =>
    new xdr.SorobanAuthorizedInvocation({
        function:
            xdr.SorobanAuthorizedFunction.sorobanAuthorizedFunctionTypeContractFn(contractArgs()),
        subInvocations: [],
    });

const addressCredentials = (signature: xdr.ScVal) =>
    xdr.SorobanCredentials.sorobanCredentialsAddressV2(
        new xdr.SorobanAddressCredentials({
            address: new Address(HOLDER).toScAddress(),
            nonce: xdr.Int64.fromString(NONCE),
            signatureExpirationLedger: 123456,
            signature,
        }),
    );

const buildTransaction = ({
    args = [],
    auth = [],
    withSorobanData = true,
}: {
    args?: xdr.ScVal[];
    auth?: xdr.SorobanAuthorizationEntry[];
    withSorobanData?: boolean;
} = {}) => {
    const builder = new TransactionBuilder(new Account(SOURCE, '1'), {
        fee: BASE_FEE,
        networkPassphrase: Networks.PUBLIC,
    })
        .addOperation(
            Operation.invokeHostFunction({
                func: xdr.HostFunction.hostFunctionTypeInvokeContract(contractArgs(args)),
                auth,
            }),
        )
        .setTimeout(180);

    if (withSorobanData) {
        builder.setSorobanData(new SorobanDataBuilder().setResourceFee(1000).build());
    }

    return builder.build();
};

describe('transformTransaction with a Soroban operation', () => {
    it('maps the contract invocation onto the device message shape', () => {
        const { operations } = transformTransaction(buildTransaction());

        expect(operations).toEqual([
            {
                type: 'invokeHostFunction',
                source: undefined,
                function: {
                    type: 0,
                    invoke_contract: {
                        contract_address: CONTRACT,
                        function_name: 'transfer',
                        args: [],
                    },
                },
                auth: [],
            },
        ]);
    });

    it('passes the soroban transaction data along as base64 XDR', () => {
        const transaction = buildTransaction();
        const expected = transaction.toEnvelope().v1().tx().ext().sorobanData().toXDR('base64');

        expect(transformTransaction(transaction).ext).toEqual({ v: 1, sorobanData: expected });
    });

    it('leaves out the extension for a transaction without soroban data', () => {
        expect(
            transformTransaction(buildTransaction({ withSorobanData: false })).ext,
        ).toBeUndefined();
    });

    it('maps every argument type the device understands', () => {
        const args = [
            nativeToScVal(true),
            xdr.ScVal.scvVoid(),
            nativeToScVal(42, { type: 'u32' }),
            nativeToScVal(-42, { type: 'i32' }),
            nativeToScVal(18446744073709551615n, { type: 'u64' }),
            nativeToScVal(-9223372036854775808n, { type: 'i64' }),
            nativeToScVal(1700000000n, { type: 'timepoint' }),
            nativeToScVal(3600n, { type: 'duration' }),
            nativeToScVal(340282366920938463463374607431768211455n, { type: 'u128' }),
            nativeToScVal(-170141183460469231731687303715884105728n, { type: 'i128' }),
            nativeToScVal(1n, { type: 'u256' }),
            nativeToScVal(-1n, { type: 'i256' }),
            xdr.ScVal.scvBytes(Buffer.from('c0ffee', 'hex')),
            nativeToScVal('a string', { type: 'string' }),
            nativeToScVal('a_symbol', { type: 'symbol' }),
            xdr.ScVal.scvVec([nativeToScVal(1, { type: 'u32' })]),
            xdr.ScVal.scvMap([
                new xdr.ScMapEntry({
                    key: nativeToScVal('k', { type: 'symbol' }),
                    val: nativeToScVal(2, { type: 'u32' }),
                }),
            ]),
            new Address(HOLDER).toScVal(),
        ];

        const [operation] = transformTransaction(buildTransaction({ args })).operations;

        expect((operation as any).function.invoke_contract.args).toEqual([
            { type: 0, b: true },
            { type: 1 },
            { type: 3, u32: 42 },
            { type: 4, i32: -42 },
            { type: 5, u64: '18446744073709551615' },
            { type: 6, i64: '-9223372036854775808' },
            { type: 7, timepoint: '1700000000' },
            { type: 8, duration: '3600' },
            { type: 9, u128: { hi: '18446744073709551615', lo: '18446744073709551615' } },
            { type: 10, i128: { hi: '-9223372036854775808', lo: '0' } },
            {
                type: 11,
                u256: { hi_hi: '0', hi_lo: '0', lo_hi: '0', lo_lo: '1' },
            },
            {
                type: 12,
                i256: {
                    hi_hi: '-1',
                    hi_lo: '18446744073709551615',
                    lo_hi: '18446744073709551615',
                    lo_lo: '18446744073709551615',
                },
            },
            { type: 13, bytes: 'c0ffee' },
            { type: 14, string: 'a string' },
            { type: 15, symbol: 'a_symbol' },
            { type: 16, vec: [{ type: 3, u32: 1 }] },
            { type: 17, map: [{ key: { type: 15, symbol: 'k' }, value: { type: 3, u32: 2 } }] },
            { type: 18, address: HOLDER },
        ]);
    });

    it('maps an authorization entry signed by the source account', () => {
        const auth = [
            new xdr.SorobanAuthorizationEntry({
                credentials: xdr.SorobanCredentials.sorobanCredentialsSourceAccount(),
                rootInvocation: rootInvocation(),
            }),
        ];

        const [operation] = transformTransaction(buildTransaction({ auth })).operations;

        expect((operation as any).auth).toEqual([
            {
                credentials: { type: 0 },
                root_invocation: {
                    function: {
                        type: 0,
                        contract_fn: {
                            contract_address: CONTRACT,
                            function_name: 'transfer',
                            args: [],
                        },
                    },
                    sub_invocations: [],
                },
            },
        ]);
    });

    it('keeps a third-party signature and its full-width nonce', () => {
        const auth = [
            new xdr.SorobanAuthorizationEntry({
                credentials: addressCredentials(nativeToScVal('signed', { type: 'symbol' })),
                rootInvocation: rootInvocation(),
            }),
        ];

        const [operation] = transformTransaction(buildTransaction({ auth })).operations;

        expect((operation as any).auth[0].credentials).toEqual({
            type: 2,
            address_v2: {
                address: HOLDER,
                nonce: NONCE,
                signature_expiration_ledger: 123456,
                signature: { type: 15, symbol: 'signed' },
            },
        });
    });

    it('refuses an authorization entry the device would have to sign itself', () => {
        const auth = [
            new xdr.SorobanAuthorizationEntry({
                credentials: addressCredentials(xdr.ScVal.scvVoid()),
                rootInvocation: rootInvocation(),
            }),
        ];

        expect(() => transformTransaction(buildTransaction({ auth }))).toThrow(
            'Soroban authorization entry is unsigned',
        );
    });

    it('refuses a host function other than a contract invocation', () => {
        const transaction = new TransactionBuilder(new Account(SOURCE, '1'), {
            fee: BASE_FEE,
            networkPassphrase: Networks.PUBLIC,
        })
            .addOperation(Operation.uploadContractWasm({ wasm: Buffer.from('00', 'hex') }))
            .setTimeout(180)
            .build();

        expect(() => transformTransaction(transaction)).toThrow(
            'Unsupported Soroban host function: hostFunctionTypeUploadContractWasm',
        );
    });

    it('refuses an argument the device message cannot express', () => {
        const args = [xdr.ScVal.scvLedgerKeyContractInstance()];

        expect(() => transformTransaction(buildTransaction({ args }))).toThrow(
            'Unsupported Soroban value type: scvLedgerKeyContractInstance',
        );
    });
});
