import {
    Account,
    Address,
    type Horizon,
    Networks,
    Operation,
    TransactionBuilder,
    nativeToScVal,
    xdr,
} from '@stellar/stellar-sdk';

import { BigNumber } from '@trezor/utils';

import { toStroops } from '../../constants';
import * as fixtures from './__fixtures__/transactions.fixture';

import { buildSendTransaction, identifyTransaction, transformTransaction } from './index';

const SOURCE = 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH';
const CONTRACT = 'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE';
const AUTH_ADDRESS = 'GDNSSYSCSSJ76FER5WEEXME5G4MTCUBKDRQSKOYP36KUKVDB2VCMERS6';
// A sint64 nonce above Number.MAX_SAFE_INTEGER, to prove full precision is preserved.
const NONCE = '6216415363851494999';

const buildSorobanData = () =>
    new xdr.SorobanTransactionData({
        ext: new xdr.SorobanTransactionDataExt(0),
        resources: new xdr.SorobanResources({
            footprint: new xdr.LedgerFootprint({ readOnly: [], readWrite: [] }),
            instructions: 0,
            diskReadBytes: 0,
            writeBytes: 0,
        }),
        resourceFee: xdr.Int64.fromString('100'),
    });

const buildAuthEntry = () => {
    const contractFn = new xdr.InvokeContractArgs({
        contractAddress: new Address(CONTRACT).toScAddress(),
        functionName: 'transfer',
        args: [nativeToScVal(1000, { type: 'i128' })],
    });

    return new xdr.SorobanAuthorizationEntry({
        credentials: xdr.SorobanCredentials.sorobanCredentialsAddressV2(
            new xdr.SorobanAddressCredentials({
                address: new Address(AUTH_ADDRESS).toScAddress(),
                nonce: xdr.Int64.fromString(NONCE),
                signatureExpirationLedger: 5000,
                signature: xdr.ScVal.scvVoid(),
            }),
        ),
        rootInvocation: new xdr.SorobanAuthorizedInvocation({
            function:
                xdr.SorobanAuthorizedFunction.sorobanAuthorizedFunctionTypeContractFn(contractFn),
            subInvocations: [],
        }),
    });
};

const buildInvokeHostFunctionTx = () => {
    const op = Operation.invokeContractFunction({
        contract: CONTRACT,
        function: 'hello',
        args: [nativeToScVal(1, { type: 'u32' }), nativeToScVal('sym', { type: 'symbol' })],
        auth: [buildAuthEntry()],
    });

    return new TransactionBuilder(new Account(SOURCE, '1'), {
        fee: '1000',
        networkPassphrase: Networks.PUBLIC,
    })
        .addOperation(op)
        .setSorobanData(buildSorobanData())
        .setTimeout(0)
        .build();
};

describe('transactions', () => {
    describe('toStroops', () => {
        fixtures.toStroops.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = toStroops(input);
                expect(result).toEqual(new BigNumber(expectedOutput));
            });
        });
    });

    describe('transformTransaction', () => {
        fixtures.transformTransactionInputs.forEach(f => {
            it(f.description, () => {
                const resp = transformTransaction(f.tx);
                expect(resp).toEqual(f.result);
            });
        });
    });

    describe('buildSendTransaction', () => {
        fixtures.buildSendTransaction.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = buildSendTransaction({
                    descriptor: input.descriptor,
                    sequence: input.sequence,
                    fee: input.fee,
                    destinationActivated: input.destinationActivated,
                    destination: input.destination,
                    amount: input.amount,
                    asset: input.asset,
                    destinationTag: input.destinationTag,
                    isTestnet: input.isTestnet,
                });
                expect(result).toEqual(expectedOutput);
            });
        });
    });

    describe('transformTransaction (Soroban InvokeHostFunction)', () => {
        const tx = buildInvokeHostFunctionTx();
        const result = transformTransaction(tx);

        it('transforms the invoke host function operation', () => {
            expect(result.operations).toEqual([
                {
                    type: 'invokeHostFunction',
                    source: undefined,
                    function: {
                        type: 0, // HOST_FUNCTION_TYPE_INVOKE_CONTRACT
                        invoke_contract: {
                            contract_address: CONTRACT,
                            function_name: 'hello',
                            args: [
                                { type: 3, u32: 1 }, // SCV_U32
                                { type: 15, symbol: 'sym' }, // SCV_SYMBOL
                            ],
                        },
                    },
                    auth: [
                        {
                            credentials: {
                                type: 2, // SOROBAN_CREDENTIALS_ADDRESS_V2
                                address_v2: {
                                    address: AUTH_ADDRESS,
                                    nonce: NONCE,
                                    signature_expiration_ledger: 5000,
                                    signature: { type: 1 }, // SCV_VOID
                                },
                            },
                            root_invocation: {
                                function: {
                                    type: 0, // SOROBAN_AUTHORIZED_FUNCTION_TYPE_CONTRACT_FN
                                    contract_fn: {
                                        contract_address: CONTRACT,
                                        function_name: 'transfer',
                                        args: [{ type: 10, i128: { hi: '0', lo: '1000' } }], // SCV_I128
                                    },
                                },
                                sub_invocations: [],
                            },
                        },
                    ],
                },
            ]);
        });

        it('preserves the sint64 nonce as a full-precision string', () => {
            const { nonce } = (result.operations[0] as any).auth[0].credentials.address_v2;
            expect(nonce).toBe(NONCE);
            expect(Number(nonce).toString()).not.toBe(NONCE); // would lose precision as a number
        });

        it('exposes the SorobanTransactionData as hex', () => {
            const ext = tx.tx.ext();
            const expected = 'sorobanData' in ext ? ext.sorobanData().toXDR('hex') : undefined;
            expect(result.sorobanData).toBe(expected);
        });
    });

    describe('identifyTransaction (untrusted Horizon record hardening)', () => {
        // Horizon backends are user-selectable (custom backends), so a single malformed record
        // must degrade to 'unknown' rather than throw out of the whole account-history .map().
        const baseRawTx = {
            hash: 'deadbeef',
            ledger_attr: 123,
            source_account: 'not-a-valid-stellar-address',
            fee_charged: '100',
            created_at: '2020-01-01T00:00:00Z',
            successful: true,
            envelope_xdr: 'this-is-not-valid-xdr',
        } as unknown as Horizon.ServerApi.TransactionRecord;

        it('does not throw on a malformed created_at (explicit-throw thrower before the guard)', () => {
            const rawTx = {
                ...baseRawTx,
                created_at: 'definitely-not-a-date',
            } as unknown as Horizon.ServerApi.TransactionRecord;

            let result: ReturnType<typeof identifyTransaction> | undefined;
            expect(() => {
                result = identifyTransaction(rawTx);
            }).not.toThrow();
            expect(result?.type).toBe('unknown');
            expect(result?.createdAt).toBeUndefined();
            expect(result?.hash).toBe('deadbeef');
        });

        it('does not throw on a missing fee_charged and a malformed source_account', () => {
            const rawTx = {
                ...baseRawTx,
                fee_charged: undefined,
                source_account: '???',
                fee_account: undefined,
            } as unknown as Horizon.ServerApi.TransactionRecord;

            let result: ReturnType<typeof identifyTransaction> | undefined;
            expect(() => {
                result = identifyTransaction(rawTx);
            }).not.toThrow();
            expect(result?.type).toBe('unknown');
            expect(result?.fee).toBe('');
            expect(result?.feeSource).toBe('');
        });

        it('does not throw on an unparseable envelope_xdr', () => {
            expect(() => identifyTransaction(baseRawTx)).not.toThrow();
            expect(identifyTransaction(baseRawTx).type).toBe('unknown');
        });
    });
});
