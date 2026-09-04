import { Address, type Transaction, nativeToScVal, rpc, xdr } from '@stellar/stellar-sdk';

import {
    SorobanSimulationError,
    getContractTokenMetadata,
    getSep41Token,
    prepareContractTransaction,
    readSep41Tokens,
} from './soroban';
import { buildContractTokenTransferTransaction } from './transactions/build';
import type { StellarRpcServer } from '../types/rpc';

const CONTRACT = 'CAS3FL6TLZKDGGSISDBWGGPXT3NRR4DYTZD7YOD3HMYO6LTJUVGRVEAM';
const OTHER_CONTRACT = 'CBI7UCH5KGSVQRO5H4SUCZUTZABCITZLRHQQZTWL2TK4RZ72TAR6IHRV';
const THIRD_CONTRACT = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75';
const READABLE_CONTRACT = 'CDEMRSGIZDEMRSGIZDEMRSGIZDEMRSGIZDEMRSGIZDEMRSGIZDEMQUNJ';
const NO_BALANCE_CONTRACT = 'CDE4TSOJZHE4TSOJZHE4TSOJZHE4TSOJZHE4TSOJZHE4TSOJZHE4T3VL';

const HOLDER = 'GADQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOZPI';

const mockServer = (retval: xdr.ScVal | undefined) => {
    const simulateTransaction = jest.fn(() => Promise.resolve({ result: { retval } }));

    return {
        server: { simulateTransaction } as unknown as StellarRpcServer,
        simulateTransaction,
    };
};

const invokedFunction = (transaction: Transaction) => {
    const [operation] = transaction.operations;
    const invocation =
        operation?.type === 'invokeHostFunction'
            ? (operation.func.value as unknown as xdr.InvokeContractArgs)
            : undefined;

    return String(invocation?.functionName);
};

// Answers each SEP-41 read by the function the simulated call invokes, so a single read can be
// made to fail without disturbing the others.
const mockTokenServer = (retvals: Record<string, xdr.ScVal | undefined>) => {
    const simulateTransaction = jest.fn((transaction: Transaction) =>
        Promise.resolve({ result: { retval: retvals[invokedFunction(transaction)] } }),
    );

    return { server: { simulateTransaction } as unknown as StellarRpcServer, simulateTransaction };
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

describe('readSep41Tokens', () => {
    // Each test uses its own contracts: `getContractTokenMetadata` caches per contract for the
    // lifetime of the module, and the batch seeds that same cache.
    const BATCHED_A = 'CAFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLBMFQX4KO';
    const BATCHED_B = 'CALBMFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLBNOTY';
    const NO_BALANCE_ENTRY = 'CAQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQSDFYJ';
    const NO_METADATA_ENTRY = 'CAWCYLBMFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLAU';
    const BATCH_FAILS = 'CA3TONZXG43TONZXG43TONZXG43TONZXG43TONZXG43TONZXG43TPZJN';
    const WARM_CACHE = 'CBBEEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEE5XW';
    const BATCH_TIMES_OUT = 'CBGU2TKNJVGU2TKNJVGU2TKNJVGU2TKNJVGU2TKNJVGU2TKNJVGU3M7O';

    const metadataScVal = (decimal: number, symbol: string, name: string) =>
        nativeToScVal(
            { decimal, name, symbol },
            {
                type: {
                    decimal: ['symbol', 'u32'],
                    name: ['symbol', 'string'],
                    symbol: ['symbol', 'string'],
                },
            },
        );

    const contractDataEntry = (contract: string, key: xdr.ScVal, val: xdr.ScVal) =>
        ({
            key: xdr.LedgerKey.contractData(
                new xdr.LedgerKeyContractData({
                    contract: Address.fromString(contract).toScAddress(),
                    durability: xdr.ContractDataDurability.persistent,
                    key,
                }),
            ),
            val: xdr.LedgerEntryData.contractData(
                new xdr.ContractDataEntry({
                    ext: xdr.ExtensionPoint.v0(),
                    contract: Address.fromString(contract).toScAddress(),
                    key,
                    durability: xdr.ContractDataDurability.persistent,
                    val,
                }),
            ),
        }) as rpc.Api.LedgerEntryResult;

    const instanceEntry = (contract: string, metadata?: xdr.ScVal) =>
        contractDataEntry(
            contract,
            xdr.ScVal.scvLedgerKeyContractInstance(),
            xdr.ScVal.scvContractInstance(
                new xdr.ScContractInstance({
                    executable: xdr.ContractExecutable.contractExecutableWasm(Buffer.alloc(32, 1)),
                    storage: metadata
                        ? [
                              new xdr.ScMapEntry({
                                  key: xdr.ScVal.scvSymbol('METADATA'),
                                  val: metadata,
                              }),
                          ]
                        : [],
                }),
            ),
        );

    const balanceEntry = (contract: string, val: xdr.ScVal) =>
        contractDataEntry(
            contract,
            nativeToScVal(['Balance', HOLDER], { type: ['symbol', 'address'] }),
            val,
        );

    const bareBalance = (amount: bigint) => nativeToScVal(amount, { type: 'i128' });

    // What a Stellar Asset Contract stores instead of a bare amount
    const sacBalance = (amount: bigint) =>
        nativeToScVal(
            { amount, authorized: true, clawback: false },
            {
                type: {
                    amount: ['symbol', 'i128'],
                    authorized: ['symbol', 'bool'],
                    clawback: ['symbol', 'bool'],
                },
            },
        );

    let getLedgerEntries: jest.Mock;
    let simulateTransaction: jest.Mock;
    let server: StellarRpcServer;

    beforeEach(() => {
        getLedgerEntries = jest.fn().mockResolvedValue({ entries: [], latestLedger: 1 });
        simulateTransaction = jest.fn().mockResolvedValue({ result: { retval: undefined } });
        server = { getLedgerEntries, simulateTransaction } as unknown as StellarRpcServer;
    });

    const respondToSimulations = (retvals: Record<string, xdr.ScVal | undefined>) => {
        simulateTransaction.mockImplementation((transaction: Transaction) =>
            Promise.resolve({ result: { retval: retvals[invokedFunction(transaction)] } }),
        );
    };

    it('describes every contract from a single ledger read', async () => {
        getLedgerEntries.mockResolvedValue({
            latestLedger: 1,
            entries: [
                instanceEntry(BATCHED_A, metadataScVal(18, 'deJTRSY', 'Janus Henderson')),
                balanceEntry(BATCHED_A, bareBalance(4200000n)),
                instanceEntry(BATCHED_B, metadataScVal(7, 'CPAL', 'Blend LP')),
                balanceEntry(BATCHED_B, sacBalance(15n)),
            ],
        });

        const tokens = await readSep41Tokens(server, HOLDER, [BATCHED_A, BATCHED_B]);

        expect(getLedgerEntries).toHaveBeenCalledTimes(1);
        expect(simulateTransaction).not.toHaveBeenCalled();
        expect(tokens).toEqual([
            {
                contract: BATCHED_A,
                balance: '4200000',
                decimals: 18,
                symbol: 'deJTRSY',
                name: 'Janus Henderson',
            },
            { contract: BATCHED_B, balance: '15', decimals: 7, symbol: 'CPAL', name: 'Blend LP' },
        ]);
    });

    it('asks the contract itself when no balance entry came back, rather than reporting zero', async () => {
        // A contract that keys its balances differently is indistinguishable from an empty one
        getLedgerEntries.mockResolvedValue({
            latestLedger: 1,
            entries: [instanceEntry(NO_BALANCE_ENTRY, metadataScVal(18, 'DEJ', 'deJTRSY'))],
        });
        respondToSimulations({ balance: bareBalance(99n) });

        const tokens = await readSep41Tokens(server, HOLDER, [NO_BALANCE_ENTRY]);

        expect(tokens).toEqual([
            {
                contract: NO_BALANCE_ENTRY,
                balance: '99',
                decimals: 18,
                symbol: 'DEJ',
                name: 'deJTRSY',
            },
        ]);
        // The batch already described it, so only the balance had to be simulated
        expect(simulateTransaction).toHaveBeenCalledTimes(1);
    });

    it('never falls back to the classic seven decimals when the instance carries no metadata', async () => {
        getLedgerEntries.mockResolvedValue({
            latestLedger: 1,
            entries: [
                instanceEntry(NO_METADATA_ENTRY),
                balanceEntry(NO_METADATA_ENTRY, bareBalance(5n)),
            ],
        });
        // The contract does not answer `decimals` either
        respondToSimulations({ balance: bareBalance(5n) });

        const tokens = await readSep41Tokens(server, HOLDER, [NO_METADATA_ENTRY]);

        expect(tokens).toEqual([
            {
                contract: NO_METADATA_ENTRY,
                balance: '5',
                decimals: undefined,
                symbol: undefined,
                name: undefined,
            },
        ]);
    });

    it('falls back for every contract when the batch fails', async () => {
        getLedgerEntries.mockRejectedValue(new Error('rpc is down'));
        respondToSimulations({
            balance: bareBalance(1n),
            decimals: xdr.ScVal.scvU32(6),
            symbol: xdr.ScVal.scvString('BATCH'),
            name: xdr.ScVal.scvString('Batch Fails'),
        });

        const tokens = await readSep41Tokens(server, HOLDER, [BATCH_FAILS]);

        expect(tokens).toEqual([
            {
                contract: BATCH_FAILS,
                balance: '1',
                decimals: 6,
                symbol: 'BATCH',
                name: 'Batch Fails',
            },
        ]);
    });

    it('gives up on a batch that outruns its budget and asks the contracts directly', async () => {
        jest.useFakeTimers();
        getLedgerEntries.mockReturnValue(new Promise(() => {}));
        respondToSimulations({
            balance: bareBalance(2n),
            decimals: xdr.ScVal.scvU32(4),
            symbol: xdr.ScVal.scvString('SLOW'),
            name: xdr.ScVal.scvString('Slow Batch'),
        });

        const pending = readSep41Tokens(server, HOLDER, [BATCH_TIMES_OUT]);
        // the batch's slice of SEP41_READ_TIMEOUT_MS
        await jest.advanceTimersByTimeAsync(4_000);
        const tokens = await pending;
        jest.useRealTimers();

        expect(tokens).toEqual([
            {
                contract: BATCH_TIMES_OUT,
                balance: '2',
                decimals: 4,
                symbol: 'SLOW',
                name: 'Slow Batch',
            },
        ]);
    });

    it('stops asking for the instance once a contract has described itself', async () => {
        getLedgerEntries.mockResolvedValue({
            latestLedger: 1,
            entries: [
                instanceEntry(WARM_CACHE, metadataScVal(9, 'WARM', 'Warm Cache')),
                balanceEntry(WARM_CACHE, bareBalance(3n)),
            ],
        });

        await readSep41Tokens(server, HOLDER, [WARM_CACHE]);
        await readSep41Tokens(server, HOLDER, [WARM_CACHE]);

        // instance + balance on the cold read, balance alone on the warm one
        expect(getLedgerEntries.mock.calls[0]).toHaveLength(2);
        expect(getLedgerEntries.mock.calls[1]).toHaveLength(1);
        expect(simulateTransaction).not.toHaveBeenCalled();
    });
});

describe('prepareContractTransaction', () => {
    const TRANSFER_TOKEN = 'CC2LJNFUWS2LJNFUWS2LJNFUWS2LJNFUWS2LJNFUWS2LJNFUWS2LJBLF';
    const RECIPIENT = 'GC23LNNVWW23LNNVWW23LNNVWW23LNNVWW23LNNVWW23LNNVWW23LKW6';

    const transfer = () =>
        buildContractTokenTransferTransaction({
            descriptor: HOLDER,
            sequence: '1',
            fee: '200',
            contract: TRANSFER_TOKEN,
            destination: RECIPIENT,
            amount: '10',
        });

    it('reports why the network says the call would fail', async () => {
        const simulateTransaction = jest
            .fn()
            .mockResolvedValue({ error: 'HostError: Error(Contract, #1)' });
        const server = { simulateTransaction } as unknown as StellarRpcServer;

        // Learning this before the device prompt is the point: the user is never asked to
        // approve a transfer that cannot succeed.
        await expect(prepareContractTransaction(server, transfer())).rejects.toBeInstanceOf(
            SorobanSimulationError,
        );
        await expect(prepareContractTransaction(server, transfer())).rejects.toMatchObject({
            diagnostic: 'HostError: Error(Contract, #1)',
        });
    });
});
