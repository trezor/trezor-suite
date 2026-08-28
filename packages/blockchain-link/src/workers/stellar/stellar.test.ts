// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { NotFoundError } from '@trezor/network-stellar';

import { BlockchainLink } from '../../index';

import StellarWorker from './index';

jest.mock('@trezor/blockchain-link-utils/src/stellar', () => ({
    ...jest.requireActual('@trezor/blockchain-link-utils/src/stellar'),
    getTokenMetadata: () => Promise.resolve({}),
}));

const DESCRIPTOR = 'GCEEMZKTHUH44YRZWQLJK6HDHKYIM5K4UYFQJSUCODVLLL7SJEYAEOET';
const ASSET_ISSUER = 'GBDVX4VELCDSQ54KQJYTNHXAHFLBCA77ZY2USQBM4CSHTTV7DME7KALE';
const OTHER_ACCOUNT = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const TX_HASH = '3a44b5d0159890a1e2b3e7ef30ff90e014ee68ac64f23a24a6cbe4c366c088a0';

const mockState: {
    accountError?: unknown;
    operationsError?: unknown;
    operationRecords: unknown[];
    joinedApplied?: boolean;
} = { operationRecords: [] };

const mockNotFoundError = () => new NotFoundError('Not Found', { status: 404 });

const mockAccount = {
    sequence: '123456',
    subentry_count: 0,
    num_sponsoring: 0,
    num_sponsored: 0,
    balances: [{ asset_type: 'native', balance: '3.3580137', selling_liabilities: '0' }],
};

const mockTransaction = {
    hash: TX_HASH,
    successful: true,
    created_at: '2026-08-24T10:00:00Z',
    fee_charged: '35602',
    fee_account: 'GA2JRQOF6EA3HQWDCEDBPPMLYPJCFLDDGYZLEQGMS5SOBQIB3BAFHVAW',
    source_account: 'GBUV66LXXULKASZ5FSDJEY42HUWIBDF4MWSVDBUJLZKCFYSWT5SDPOQB',
    ledger_attr: 56802294,
    memo_type: 'none',
};

const sacOperation = (assetBalanceChanges: unknown[]) => ({
    id: '275308962747973633',
    paging_token: '275308962747973633',
    type: 'invoke_host_function',
    transaction_hash: TX_HASH,
    source_account: mockTransaction.source_account,
    asset_balance_changes: assetBalanceChanges,
    transaction: () => Promise.resolve(mockTransaction),
});

const mint = (amount: string) => ({
    asset_type: 'credit_alphanum4',
    asset_code: 'KALE',
    asset_issuer: ASSET_ISSUER,
    type: 'mint',
    to: DESCRIPTOR,
    amount,
});

jest.mock('@trezor/network-stellar/runtime', () => ({
    __esModule: true,
    default: () => {
        const actual = jest.requireActual('@trezor/network-stellar');

        return Promise.resolve({
            ...actual,
            // keeps the Soroban contract-token read off the network
            readSep41Tokens: () => Promise.resolve([]),
            getStellarConnection: () =>
                Promise.resolve({
                    api: {
                        accounts: () => ({
                            accountId: () => ({
                                call: () => {
                                    if (mockState.accountError) throw mockState.accountError;

                                    return Promise.resolve(mockAccount);
                                },
                            }),
                        }),
                        operations: () => {
                            const builder = {
                                forAccount: () => builder,
                                includeFailed: () => builder,
                                join: () => {
                                    mockState.joinedApplied = true;

                                    return builder;
                                },
                                limit: () => builder,
                                order: () => builder,
                                cursor: () => builder,
                                call: () => {
                                    if (mockState.operationsError) {
                                        throw mockState.operationsError;
                                    }

                                    return Promise.resolve({
                                        records: mockState.operationRecords,
                                    });
                                },
                            };

                            return builder;
                        },
                    },
                    isTestnet: false,
                }),
        });
    },
}));

describe('Stellar worker account history', () => {
    let blockchain: BlockchainLink;

    beforeEach(() => {
        mockState.accountError = undefined;
        mockState.operationsError = undefined;
        mockState.operationRecords = [];
        mockState.joinedApplied = false;
        blockchain = new BlockchainLink({
            name: 'Stellar',
            worker: StellarWorker,
            server: ['https://mocked'],
            debug: false,
        });
    });

    afterEach(() => {
        blockchain.dispose();
    });

    it('history not found is returned as an empty transaction list', async () => {
        mockState.operationsError = mockNotFoundError();
        const result = await blockchain.getAccountInfo({ descriptor: DESCRIPTOR, details: 'txs' });
        expect(result.empty).toBe(false);
        expect(result.balance).toBe('33580137');
        expect(result.history.transactions).toEqual([]);
        expect(result.stellarCursor).toBeUndefined();
    });

    it('history fetch failure is rethrown', async () => {
        mockState.operationsError = new Error('Internal Server Error');
        await expect(
            blockchain.getAccountInfo({ descriptor: DESCRIPTOR, details: 'txs' }),
        ).rejects.toThrow('Internal Server Error');
    });

    it('account not found is returned as an empty account', async () => {
        mockState.accountError = mockNotFoundError();
        const result = await blockchain.getAccountInfo({ descriptor: DESCRIPTOR, details: 'txs' });
        expect(result.empty).toBe(true);
        expect(result.balance).toBe('0');
    });

    it('account fetch failure is rethrown', async () => {
        mockState.accountError = new Error('Too Many Requests');
        await expect(
            blockchain.getAccountInfo({ descriptor: DESCRIPTOR, details: 'txs' }),
        ).rejects.toThrow('Too Many Requests');
    });

    it('joins the transaction into the operations request', async () => {
        mockState.operationRecords = [sacOperation([mint('0.1447280')])];
        await blockchain.getAccountInfo({ descriptor: DESCRIPTOR, details: 'txs' });
        // Without the join, reading operation.transaction() costs one request per operation
        expect(mockState.joinedApplied).toBe(true);
    });

    it('maps every balance change of a Stellar Asset Contract transfer', async () => {
        mockState.operationRecords = [
            sacOperation([mint('0.1447280'), mint('0.1723958'), mint('0.1355544')]),
        ];

        const result = await blockchain.getAccountInfo({
            descriptor: DESCRIPTOR,
            details: 'txs',
        });

        expect(result.stellarCursor).toBe('275308962747973633');
        expect(result.history.transactions).toHaveLength(1);

        const [transaction] = result.history.transactions!;
        expect(transaction!.txid).toBe(TX_HASH);
        expect(transaction!.type).toBe('recv');
        expect(transaction!.fee).toBe('35602');
        // fee-bumped: paid by fee_account, not by the inner source_account
        expect(transaction!.stellarSpecific?.feeSource).toBe(mockTransaction.fee_account);
        expect(transaction!.tokens).toEqual([
            expect.objectContaining({
                type: 'recv',
                standard: 'STELLAR-CLASSIC',
                contract: `KALE-${ASSET_ISSUER}`,
                symbol: 'KALE',
                decimals: 7,
                // mint has no `from`, so the issuer stands in
                from: ASSET_ISSUER,
                to: DESCRIPTOR,
                amount: '1447280',
            }),
            expect.objectContaining({ amount: '1723958' }),
            expect.objectContaining({ amount: '1355544' }),
        ]);
    });

    it('ignores balance changes between other participants of the same call', async () => {
        mockState.operationRecords = [
            sacOperation([{ ...mint('0.5000000'), to: OTHER_ACCOUNT }, mint('0.1447280')]),
        ];

        const result = await blockchain.getAccountInfo({
            descriptor: DESCRIPTOR,
            details: 'txs',
        });

        expect(result.history.transactions![0]!.tokens).toEqual([
            expect.objectContaining({ amount: '1447280', to: DESCRIPTOR }),
        ]);
    });
});
