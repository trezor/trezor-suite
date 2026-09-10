import { type Transaction, xdr } from '@stellar/stellar-sdk';

import { type SorobanServer, getContractTokenMetadata, getSep41Token } from './soroban';

const CONTRACT = 'CAS3FL6TLZKDGGSISDBWGGPXT3NRR4DYTZD7YOD3HMYO6LTJUVGRVEAM';
const OTHER_CONTRACT = 'CBI7UCH5KGSVQRO5H4SUCZUTZABCITZLRHQQZTWL2TK4RZ72TAR6IHRV';
const THIRD_CONTRACT = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75';
const READABLE_CONTRACT = 'CDEMRSGIZDEMRSGIZDEMRSGIZDEMRSGIZDEMRSGIZDEMRSGIZDEMQUNJ';
const NO_BALANCE_CONTRACT = 'CDE4TSOJZHE4TSOJZHE4TSOJZHE4TSOJZHE4TSOJZHE4TSOJZHE4T3VL';

const HOLDER = 'GADQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOZPI';

const mockServer = (retval: xdr.ScVal | undefined) => {
    const simulateTransaction = jest.fn(() => Promise.resolve({ result: { retval } }));

    return {
        server: { simulateTransaction } as unknown as SorobanServer,
        simulateTransaction,
    };
};

// Answers each SEP-41 read by the function the simulated call invokes, so a single read can be
// made to fail without disturbing the others.
const mockTokenServer = (retvals: Record<string, xdr.ScVal | undefined>) => {
    const simulateTransaction = jest.fn((transaction: Transaction) => {
        const [operation] = transaction.operations;
        const invocation =
            operation?.type === 'invokeHostFunction'
                ? (operation.func.value as unknown as xdr.InvokeContractArgs)
                : undefined;

        return Promise.resolve({ result: { retval: retvals[String(invocation?.functionName)] } });
    });

    return { server: { simulateTransaction } as unknown as SorobanServer, simulateTransaction };
};

describe('getContractTokenMetadata', () => {
    it('reads a contract only once, since its metadata cannot change', async () => {
        const { server, simulateTransaction } = mockServer(xdr.ScVal.scvU32(7));

        const first = await getContractTokenMetadata(server, CONTRACT);
        const second = await getContractTokenMetadata(server, CONTRACT);

        // decimals + symbol + name, from the first read only
        expect(simulateTransaction).toHaveBeenCalledTimes(3);
        expect(second).toEqual(first);
        expect(second.decimals).toBe(7);
    });

    it('shares one in-flight read between concurrent callers', async () => {
        const { server, simulateTransaction } = mockServer(xdr.ScVal.scvU32(7));

        const [first, second] = await Promise.all([
            getContractTokenMetadata(server, THIRD_CONTRACT),
            getContractTokenMetadata(server, THIRD_CONTRACT),
        ]);

        expect(simulateTransaction).toHaveBeenCalledTimes(3);
        expect(second).toEqual(first);
    });

    it('does not keep a read that told us nothing about the contract', async () => {
        const { server, simulateTransaction } = mockServer(undefined);

        await getContractTokenMetadata(server, OTHER_CONTRACT);
        await getContractTokenMetadata(server, OTHER_CONTRACT);

        expect(simulateTransaction).toHaveBeenCalledTimes(6);
    });
});

describe('getSep41Token', () => {
    const metadata = {
        decimals: xdr.ScVal.scvU32(18),
        symbol: xdr.ScVal.scvString('deJTRSY'),
        name: xdr.ScVal.scvString('Janus Henderson Short-Term US Treasury'),
    };

    it('reports the balance alongside the metadata read from the contract', async () => {
        const { server } = mockTokenServer({
            ...metadata,
            balance: xdr.ScVal.scvI128(
                new xdr.Int128Parts({
                    hi: xdr.Int64.fromString('0'),
                    lo: xdr.Uint64.fromString('4200000'),
                }),
            ),
        });

        await expect(getSep41Token(server, READABLE_CONTRACT, HOLDER)).resolves.toEqual({
            contract: READABLE_CONTRACT,
            balance: '4200000',
            decimals: 18,
            symbol: 'deJTRSY',
            name: 'Janus Henderson Short-Term US Treasury',
        });
    });

    it('reports no token when the balance cannot be read, rather than a zero balance', async () => {
        const { server } = mockTokenServer({ ...metadata, balance: undefined });

        await expect(getSep41Token(server, NO_BALANCE_CONTRACT, HOLDER)).resolves.toBeUndefined();
    });
});
