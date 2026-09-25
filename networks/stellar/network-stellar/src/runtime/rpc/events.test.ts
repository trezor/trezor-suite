import { Address, Contract, nativeToScVal, xdr } from '@stellar/stellar-sdk';

import { readContractTokenTransfers } from './events';
import type { StellarRpcServer } from '../../types/rpc';

const ACCOUNT = 'GBUV66LXXULKASZ5FSDJEY42HUWIBDF4MWSVDBUJLZKCFYSWT5SDPOQB';
const SENDER = 'GA2JRQOF6EA3HQWDCEDBPPMLYPJCFLDDGYZLEQGMS5SOBQIB3BAFHVAW';
const CONTRACT = 'CC64WBDGS6QQP22QTTIACYIXT3WF7BBQEYOQPLTP7GTKYY7PZ74QYGSL';
const OTHER_CONTRACTS = [
    'CBI7UCH5KGSVQRO5H4SUCZUTZABCITZLRHQQZTWL2TK4RZ72TAR6IHRV',
    'CAS3FL6TLZKDGGSISDBWGGPXT3NRR4DYTZD7YOD3HMYO6LTJUVGRVEAM',
    'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
    'CDEMRSGIZDEMRSGIZDEMRSGIZDEMRSGIZDEMRSGIZDEMRSGIZDEMQUNJ',
    'CDE4TSOJZHE4TSOJZHE4TSOJZHE4TSOJZHE4TSOJZHE4TSOJZHE4T3VL',
];

const symbol = (name: string) => nativeToScVal(name, { type: 'symbol' });
const address = (value: string) => Address.fromString(value).toScVal();
const i128 = (value: bigint) => nativeToScVal(value, { type: 'i128' });

const transferEvent = ({
    contract = CONTRACT,
    from = SENDER,
    to = ACCOUNT,
    value = i128(4200000n),
    ledger = 100,
    txHash = 'hash-1',
    inSuccessfulContractCall,
    topic,
}: {
    contract?: string;
    from?: string;
    to?: string;
    value?: xdr.ScVal;
    ledger?: number;
    txHash?: string;
    inSuccessfulContractCall?: boolean;
    topic?: xdr.ScVal[];
}) => ({
    id: `${ledger}-0`,
    type: 'contract' as const,
    ledger,
    ledgerClosedAt: '2026-09-16T12:00:00Z',
    transactionIndex: 0,
    operationIndex: 0,
    // Nodes before protocol 23 sent the flag; newer ones omit it.
    ...(inSuccessfulContractCall !== undefined && { inSuccessfulContractCall }),
    txHash,
    contractId: new Contract(contract),
    topic: topic ?? [symbol('transfer'), address(from), address(to)],
    value,
});

const mockServer = (pages: ReturnType<typeof transferEvent>[][]) => {
    const getEvents = jest.fn();
    pages.forEach((events, index) =>
        getEvents.mockResolvedValueOnce({
            events,
            cursor: `cursor-${index}`,
            latestLedger: 500,
            oldestLedger: 50,
            latestLedgerCloseTime: '0',
            oldestLedgerCloseTime: '0',
        }),
    );

    return {
        server: {
            getHealth: jest.fn().mockResolvedValue({ oldestLedger: 50, latestLedger: 500 }),
            getEvents,
        } as unknown as StellarRpcServer,
        getEvents,
    };
};

describe(readContractTokenTransfers.name, () => {
    it('asks the node for transfers either way from the oldest ledger it keeps', async () => {
        const { server, getEvents } = mockServer([[transferEvent({})]]);

        const transfers = await readContractTokenTransfers({
            server,
            account: ACCOUNT,
            contractIds: [CONTRACT],
        });

        expect(getEvents).toHaveBeenCalledWith({
            startLedger: 50,
            limit: 200,
            filters: [
                {
                    type: 'contract',
                    contractIds: [CONTRACT],
                    topics: [
                        [
                            symbol('transfer').toXdr('base64'),
                            '*',
                            address(ACCOUNT).toXdr('base64'),
                            '**',
                        ],
                        [
                            symbol('transfer').toXdr('base64'),
                            address(ACCOUNT).toXdr('base64'),
                            '*',
                            '**',
                        ],
                    ],
                },
            ],
        });
        expect(transfers).toEqual([
            {
                contract: CONTRACT,
                txHash: 'hash-1',
                ledger: 100,
                closedAt: Date.parse('2026-09-16T12:00:00Z') / 1000,
                from: SENDER,
                to: ACCOUNT,
                amount: '4200000',
            },
        ]);
    });

    it('reads what the account sent, which Horizon reports without an amount', async () => {
        const { server } = mockServer([
            [transferEvent({ from: ACCOUNT, to: SENDER, txHash: 'sent' })],
        ]);

        const transfers = await readContractTokenTransfers({
            server,
            account: ACCOUNT,
            contractIds: [CONTRACT],
        });

        expect(transfers).toEqual([
            expect.objectContaining({ txHash: 'sent', from: ACCOUNT, to: SENDER }),
        ]);
    });

    it('reports a transfer the account made to itself once, though it matches both patterns', async () => {
        const self = transferEvent({ from: ACCOUNT, to: ACCOUNT, txHash: 'self' });
        const { server } = mockServer([[self, { ...self }]]);

        const transfers = await readContractTokenTransfers({
            server,
            account: ACCOUNT,
            contractIds: [CONTRACT],
        });

        expect(transfers).toHaveLength(1);
    });

    it('reads the amount of a protocol 23 event that carries a muxed recipient too', async () => {
        const value = xdr.ScVal.scvMap([
            new xdr.ScMapEntry({ key: symbol('amount'), val: i128(15n) }),
            new xdr.ScMapEntry({
                key: symbol('to_muxed_id'),
                val: nativeToScVal(7n, { type: 'u64' }),
            }),
        ]);
        const { server } = mockServer([[transferEvent({ value })]]);

        const [transfer] = await readContractTokenTransfers({
            server,
            account: ACCOUNT,
            contractIds: [CONTRACT],
        });

        expect(transfer?.amount).toBe('15');
    });

    it('skips failed calls and events whose parties are not addresses', async () => {
        const { server } = mockServer([
            [
                transferEvent({ inSuccessfulContractCall: false, txHash: 'failed' }),
                transferEvent({
                    topic: [symbol('transfer'), symbol('nobody'), address(ACCOUNT)],
                    txHash: 'odd',
                }),
                transferEvent({ txHash: 'flagged', ledger: 101, inSuccessfulContractCall: true }),
                transferEvent({ txHash: 'unflagged', ledger: 102 }),
            ],
        ]);

        const transfers = await readContractTokenTransfers({
            server,
            account: ACCOUNT,
            contractIds: [CONTRACT],
        });

        expect(transfers.map(({ txHash }) => txHash)).toEqual(['unflagged', 'flagged']);
    });

    it('follows the cursor while pages are full and returns the newest transfer first', async () => {
        const fullPage = Array.from({ length: 200 }, (_, index) =>
            transferEvent({ ledger: 100 + index, txHash: `hash-${index}` }),
        );
        const { server, getEvents } = mockServer([
            fullPage,
            [transferEvent({ ledger: 400, txHash: 'newest' })],
        ]);

        const transfers = await readContractTokenTransfers({
            server,
            account: ACCOUNT,
            contractIds: [CONTRACT],
        });

        expect(getEvents).toHaveBeenCalledTimes(2);
        expect(getEvents.mock.calls[1]?.[0]).toMatchObject({ cursor: 'cursor-0', limit: 200 });
        expect(getEvents.mock.calls[1]?.[0]).not.toHaveProperty('startLedger');
        expect(transfers).toHaveLength(201);
        expect(transfers[0]?.txHash).toBe('newest');
    });

    it('splits the contracts into filters of five, and the filters into requests of five', async () => {
        const contractIds = [CONTRACT, ...OTHER_CONTRACTS];
        const { server, getEvents } = mockServer([[], []]);

        await readContractTokenTransfers({ server, account: ACCOUNT, contractIds });

        expect(getEvents).toHaveBeenCalledTimes(1);
        expect(
            getEvents.mock.calls[0]?.[0].filters.map(
                (f: { contractIds: string[] }) => f.contractIds,
            ),
        ).toEqual([contractIds.slice(0, 5), contractIds.slice(5)]);
    });

    it('does not touch the node when there is no contract to ask about', async () => {
        const { server, getEvents } = mockServer([]);

        expect(
            await readContractTokenTransfers({ server, account: ACCOUNT, contractIds: [] }),
        ).toEqual([]);
        expect(getEvents).not.toHaveBeenCalled();
    });
});
