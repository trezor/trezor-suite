import {
    Account,
    Address,
    Asset,
    BASE_FEE,
    Keypair,
    Networks,
    Operation,
    SorobanDataBuilder,
    TransactionBuilder,
    nativeToScVal,
    xdr,
} from '@stellar/stellar-sdk';

import { decodeSorobanInvocation } from './decodeContractCall';

const SOURCE = 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH';
const ROUTER = 'CAS3FL6TLZKDGGSISDBWGGPXT3NRR4DYTZD7YOD3HMYO6LTJUVGRVEAM';
const USDC_SAC = 'CDWFVPEN2TZ4KL6QJBKMSI6PUF5IBJCH5VAZHIPQIL7VOF7ZBH6IXL75';

const u128 = (value: string) => nativeToScVal(BigInt(value), { type: 'u128' });

const invokeContractArgs = ({
    contract,
    functionName,
    args = [],
}: {
    contract: string;
    functionName: string;
    args?: xdr.ScVal[];
}) =>
    new xdr.InvokeContractArgs({
        contractAddress: new Address(contract).toScAddress(),
        functionName,
        args,
    });

/** `swap_chained(source, path, tokenIn, amountIn, minAmountOut)` on a DEX router. */
const swapArgs = () =>
    invokeContractArgs({
        contract: ROUTER,
        functionName: 'swap_chained',
        args: [
            new Address(SOURCE).toScVal(),
            nativeToScVal([Buffer.from('24f9c991', 'hex')], { type: 'bytes' }),
            new Address(USDC_SAC).toScVal(),
            u128('20000000'),
            u128('19777295'),
        ],
    });

const authorizedInvocation = (
    args: xdr.InvokeContractArgs,
    subInvocations: xdr.SorobanAuthorizedInvocation[] = [],
) =>
    new xdr.SorobanAuthorizedInvocation({
        function: xdr.SorobanAuthorizedFunction.sorobanAuthorizedFunctionTypeContractFn(args),
        subInvocations,
    });

const buildEnvelope = (operation: xdr.Operation) =>
    new TransactionBuilder(new Account(SOURCE, '1'), {
        fee: BASE_FEE,
        networkPassphrase: Networks.PUBLIC,
    })
        .addOperation(operation)
        .setSorobanData(new SorobanDataBuilder().setResourceFee(1000).build())
        .setTimeout(180)
        .build()
        .toEnvelope()
        .toXDR('base64');

const buildSwapEnvelope = (auth: xdr.SorobanAuthorizationEntry[] = []) =>
    buildEnvelope(
        Operation.invokeHostFunction({
            func: xdr.HostFunction.hostFunctionTypeInvokeContract(swapArgs()),
            auth,
        }),
    );

describe('decodeSorobanInvocation', () => {
    it('reads the contract, the function and its positional arguments', () => {
        expect(decodeSorobanInvocation(buildSwapEnvelope())).toEqual({
            contractId: ROUTER,
            functionName: 'swap_chained',
            args: [
                { kind: 'address', value: SOURCE },
                { kind: 'text', value: '[0x24f9c991]' },
                { kind: 'address', value: USDC_SAC },
                { kind: 'text', value: '20000000' },
                { kind: 'text', value: '19777295' },
            ],
            authorizedCalls: [],
        });
    });

    it('flattens the authorization tree depth-first, keeping the nesting depth', () => {
        const transfer = invokeContractArgs({
            contract: USDC_SAC,
            functionName: 'transfer',
            args: [new Address(SOURCE).toScVal(), new Address(ROUTER).toScVal(), u128('20000000')],
        });
        const entry = new xdr.SorobanAuthorizationEntry({
            credentials: xdr.SorobanCredentials.sorobanCredentialsSourceAccount(),
            rootInvocation: authorizedInvocation(swapArgs(), [authorizedInvocation(transfer)]),
        });

        expect(decodeSorobanInvocation(buildSwapEnvelope([entry]))?.authorizedCalls).toEqual([
            { contractId: ROUTER, functionName: 'swap_chained', depth: 0 },
            { contractId: USDC_SAC, functionName: 'transfer', depth: 1 },
        ]);
    });

    it('reads the invocation out of a fee-bumped envelope', () => {
        const innerTx = new TransactionBuilder(new Account(SOURCE, '1'), {
            fee: BASE_FEE,
            networkPassphrase: Networks.PUBLIC,
        })
            .addOperation(
                Operation.invokeHostFunction({
                    func: xdr.HostFunction.hostFunctionTypeInvokeContract(swapArgs()),
                    auth: [],
                }),
            )
            .setSorobanData(new SorobanDataBuilder().setResourceFee(1000).build())
            .setTimeout(180)
            .build();
        innerTx.sign(Keypair.random());

        const feeBump = TransactionBuilder.buildFeeBumpTransaction(
            Keypair.random(),
            '2000000',
            innerTx,
            Networks.PUBLIC,
        );

        expect(decodeSorobanInvocation(feeBump.toEnvelope().toXDR('base64'))).toMatchObject({
            contractId: ROUTER,
            functionName: 'swap_chained',
        });
    });

    it.each([
        [
            'a classic payment',
            buildEnvelope(
                Operation.payment({
                    destination: SOURCE,
                    asset: Asset.native(),
                    amount: '1',
                }),
            ),
        ],
        [
            'a contract deployment, which has no arguments to show',
            buildEnvelope(
                Operation.invokeHostFunction({
                    func: xdr.HostFunction.hostFunctionTypeCreateContract(
                        new xdr.CreateContractArgs({
                            contractIdPreimage: xdr.ContractIdPreimage.contractIdPreimageFromAsset(
                                Asset.native().toXDRObject(),
                            ),
                            executable: xdr.ContractExecutable.contractExecutableStellarAsset(),
                        }),
                    ),
                    auth: [],
                }),
            ),
        ],
        ['unreadable XDR', 'not-base64-xdr'],
        ['an empty string', ''],
    ])('returns undefined for %s', (_label, envelopeXdr) => {
        expect(decodeSorobanInvocation(envelopeXdr)).toBeUndefined();
    });
});
