import { createStellarDataSource } from './datasource';
import type { StellarAPI, StellarHorizonServer } from '../types';
import type { StellarRpcServer } from '../types/rpc';

const DESCRIPTOR = 'GBSXTBPFJOJ64NSYRFE2F6P6TPMMSD45KQZH5TEWIBEAHICY6IZVGCET';
const ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

const HORIZON_ACCOUNT = {
    sequence: '4242',
    subentry_count: 2,
    num_sponsoring: 0,
    num_sponsored: 0,
    balances: [
        { asset_type: 'native', balance: '10.0000000', selling_liabilities: '1.0000000' },
        {
            asset_type: 'credit_alphanum4',
            asset_code: 'USDC',
            asset_issuer: ISSUER,
            balance: '2.5000000',
        },
    ],
};

const HORIZON_LEDGER = {
    sequence: 99,
    hash: 'ledger-hash',
    protocol_version: 22,
    base_reserve_in_stroops: 5000000,
};

// `_getLatestLedger` is the raw response: `protocolVersion` is a string, and the node ships the
// whole ledger close meta in `metadataXdr` — which is exactly why Horizon is asked first.
const RPC_RAW_HEAD = {
    id: 'rpc-hash',
    sequence: 7,
    protocolVersion: '23',
    closeTime: '0',
    headerXdr: '',
    metadataXdr: '',
};

const unreachable = () => Promise.reject(new Error('ECONNREFUSED'));

type HorizonStub = {
    accountCalls: number;
    ledgerCalls: number;
    horizon: StellarHorizonServer;
};

const createHorizonStub = (): HorizonStub => {
    const stub: HorizonStub = {
        accountCalls: 0,
        ledgerCalls: 0,
        horizon: {
            accounts: () => ({
                accountId: () => ({
                    call: () => {
                        stub.accountCalls += 1;

                        return Promise.resolve(HORIZON_ACCOUNT);
                    },
                }),
            }),
            ledgers: () => ({
                order: () => ({
                    limit: () => ({
                        call: () => {
                            stub.ledgerCalls += 1;

                            return Promise.resolve({ records: [HORIZON_LEDGER] });
                        },
                    }),
                }),
            }),
            root: () => Promise.resolve({ core_version: 'core-21.0.0' }),
        } as unknown as StellarHorizonServer,
    };

    return stub;
};

const createApi = (rpc: Partial<StellarRpcServer>, horizon: StellarHorizonServer): StellarAPI =>
    ({ rpc: rpc as StellarRpcServer, horizon }) as StellarAPI;

describe('createStellarDataSource', () => {
    describe('readAccountState', () => {
        it('degrades to Horizon when the RPC read cannot answer', async () => {
            const { horizon } = createHorizonStub();
            const dataSource = createStellarDataSource(
                createApi({ getLedgerEntries: unreachable }, horizon),
            );

            await expect(
                dataSource.readAccountState({ descriptor: DESCRIPTOR, knownAssets: [] }),
            ).resolves.toEqual({
                exists: true,
                balance: '100000000',
                sequence: '4242',
                numSubEntries: 2,
                numSponsoring: 0,
                numSponsored: 0,
                sellingLiabilities: '10000000',
                trustlines: [{ assetCode: 'USDC', assetIssuer: ISSUER, balance: '25000000' }],
            });
        });

        it('trusts an RPC answer that the account has no ledger entry', async () => {
            const stub = createHorizonStub();
            const dataSource = createStellarDataSource(
                createApi(
                    { getLedgerEntries: () => Promise.resolve({ entries: [], latestLedger: 1 }) },
                    stub.horizon,
                ),
            );

            const state = await dataSource.readAccountState({
                descriptor: DESCRIPTOR,
                knownAssets: [],
            });

            // The ledger, not Horizon, decides whether an account is funded — so the empty RPC
            // answer stands and Horizon is read once for trustline discovery only.
            expect(state.exists).toBe(false);
            expect(state.balance).toBe('0');
            expect(stub.accountCalls).toBe(1);
        });

        it('rethrows the RPC failure when the fallback is off', async () => {
            const { horizon } = createHorizonStub();
            const dataSource = createStellarDataSource(
                createApi({ getLedgerEntries: unreachable }, horizon),
                'horizon',
                'off',
            );

            await expect(
                dataSource.readAccountState({ descriptor: DESCRIPTOR, knownAssets: [] }),
            ).rejects.toThrow('ECONNREFUSED');
        });
    });

    describe('readLatestLedger', () => {
        const HEAD = {
            sequence: 99,
            hash: 'ledger-hash',
            baseReserve: '5000000',
            protocolVersion: 22,
        };

        it('reads the head from Horizon without touching RPC', async () => {
            const stub = createHorizonStub();
            // `getLatestLedger` would answer too, but it ships the entire ledger close meta.
            const rpc = { _getLatestLedger: jest.fn(unreachable) };
            const dataSource = createStellarDataSource(createApi(rpc, stub.horizon));

            await expect(dataSource.readLatestLedger()).resolves.toEqual(HEAD);
            expect(stub.ledgerCalls).toBe(1);
            expect(rpc._getLatestLedger).not.toHaveBeenCalled();
        });

        it('stands in with RPC when Horizon cannot serve the head', async () => {
            const { horizon } = createHorizonStub();
            const rpcHead = { _getLatestLedger: () => Promise.resolve(RPC_RAW_HEAD) };
            const dataSource = createStellarDataSource(
                createApi(rpcHead, {
                    ...horizon,
                    ledgers: () => ({
                        order: () => ({ limit: () => ({ call: unreachable }) }),
                    }),
                } as unknown as StellarHorizonServer),
            );

            const head = await dataSource.readLatestLedger();

            expect(head.sequence).toBe(7);
            expect(head.hash).toBe('rpc-hash');
        });

        it('reads the head over RPC when that source is selected', async () => {
            const stub = createHorizonStub();
            const rpcHead = { _getLatestLedger: () => Promise.resolve(RPC_RAW_HEAD) };
            const dataSource = createStellarDataSource(
                createApi(rpcHead, stub.horizon),
                'horizon',
                'horizon',
                'rpc',
            );

            await expect(dataSource.readLatestLedger()).resolves.toMatchObject({ sequence: 7 });
            expect(stub.ledgerCalls).toBe(0);
        });
    });

    describe('readVersion', () => {
        it('degrades to the Horizon core version', async () => {
            const { horizon } = createHorizonStub();
            const dataSource = createStellarDataSource(
                createApi({ getVersionInfo: unreachable }, horizon),
            );

            await expect(dataSource.readVersion()).resolves.toBe('core-21.0.0');
        });
    });
});
