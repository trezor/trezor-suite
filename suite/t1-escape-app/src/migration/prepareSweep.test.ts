import { prepareSweep } from './prepareSweep';
import { createSweepLedger } from './sweepLedger';
import { mockHistoryTransaction } from '../../mocks/mockAccountInfo';
import { mockBackend, mockFundedAccount } from '../../mocks/mockBackend';
import { mockWallet } from '../../mocks/mockWallet';
import { MAX_SWEEP_INPUTS } from '../bitcoin/composeSweep';
import { validateDestination } from '../bitcoin/destinationAddress';
import { getOutpointKey } from '../bitcoin/outpoint';

const DESTINATION = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2';

const setup = (amounts: string[]) => {
    const chain = mockBackend();
    const { account, utxos } = mockFundedAccount({
        chain,
        wallet: mockWallet(),
        accountType: 'p2pkh',
        amounts,
    });
    const ledger = createSweepLedger();
    const destination = validateDestination({
        input: DESTINATION,
        firmwareVersion: [1, 6, 3],
        ownScripts: new Set(),
    });
    if (!destination.success) throw new Error('test destination must be valid');

    const prepare = (getRandomInt = () => 11) =>
        prepareSweep({
            backend: chain.backend,
            ledger,
            account,
            destination: destination.payload,
            firmwareVersion: [1, 6, 3],
            getRandomInt,
        });

    return { chain, account, utxos, ledger, prepare };
};

describe('prepareSweep', () => {
    it('composes a sweep of all confirmed outputs from a fresh snapshot', async () => {
        const { chain, prepare, utxos } = setup(['100000', '250000']);

        const prepared = await prepare();

        expect(prepared).toMatchObject({
            success: true,
            payload: { followingTransactions: 0, leftovers: [] },
        });
        expect(
            prepared.success && new Set(prepared.payload.plan?.utxos.map(getOutpointKey)),
        ).toEqual(new Set(utxos.map(getOutpointKey)));
        expect(chain.backend.getAccountUtxo).toHaveBeenCalledTimes(1);
    });

    it('gives every composition a different amount, even with the same random number', async () => {
        const { prepare, ledger } = setup(['100000', '250000']);

        const first = await prepare();
        const second = await prepare();
        const third = await prepare();

        const amounts = [first, second, third].map(
            prepared => prepared.success && prepared.payload.plan?.amount,
        );
        expect(new Set(amounts).size).toBe(3);
        expect(ledger.getUsedAmounts()).toEqual(new Set(amounts));
    });

    it('keeps amounts unique across accounts paying the same destination', async () => {
        const { chain, ledger, prepare } = setup(['100000', '250000']);
        // A second account that happens to hold exactly the same value.
        const other = mockFundedAccount({
            chain,
            wallet: mockWallet(),
            accountType: 'p2pkh',
            accountIndex: 1,
            amounts: ['100000', '250000'],
        });
        const destination = validateDestination({
            input: DESTINATION,
            firmwareVersion: [1, 6, 3],
            ownScripts: new Set(),
        });
        if (!destination.success) throw new Error('test destination must be valid');

        const first = await prepare();
        const second = await prepareSweep({
            backend: chain.backend,
            ledger,
            account: other.account,
            destination: destination.payload,
            firmwareVersion: [1, 6, 3],
            getRandomInt: () => 11,
        });

        expect(first.success && second.success).toBe(true);
        expect(second.success && second.payload.plan?.amount).not.toBe(
            first.success && first.payload.plan?.amount,
        );
    });

    it('limits a transaction to 50 inputs and announces the following ones', async () => {
        const amounts = Array.from({ length: 120 }, (_, index) => (200000 + index).toString());
        const { prepare } = setup(amounts);

        const prepared = await prepare();

        expect(prepared.success && prepared.payload.plan?.inputs).toHaveLength(MAX_SWEEP_INPUTS);
        expect(prepared.success && prepared.payload.followingTransactions).toBe(2);
    });

    it('lists outputs that are not worth spending and unconfirmed ones as leftovers', async () => {
        const { chain, account, prepare, utxos } = setup(['100000', '5000', '300000']);
        chain.utxos.set(account.descriptor, [
            utxos[0]!,
            utxos[1]!,
            { ...utxos[2]!, confirmations: 0, blockHeight: -1 },
        ]);

        const prepared = await prepare();

        expect(prepared.success && prepared.payload.plan?.utxos.map(getOutpointKey)).toEqual([
            getOutpointKey(utxos[0]!),
        ]);
        expect(prepared.success && prepared.payload.leftovers).toEqual([
            { utxo: utxos[1], reason: 'uneconomic' },
            { utxo: expect.objectContaining({ txid: utxos[2]!.txid }), reason: 'unconfirmed' },
        ]);
    });

    it('reports outputs that cannot cover the transaction fee instead of a plan', async () => {
        const { prepare, utxos } = setup(['9000']);

        const prepared = await prepare();

        expect(prepared).toMatchObject({
            success: true,
            payload: {
                followingTransactions: 0,
                leftovers: [{ utxo: utxos[0], reason: 'insufficient-for-fee' }],
            },
        });
        expect(prepared.success && prepared.payload.plan).toBeUndefined();
    });

    it('returns no plan for an account without outputs', async () => {
        const { prepare } = setup([]);

        const prepared = await prepare();

        expect(prepared).toMatchObject({ success: true, payload: { leftovers: [] } });
        expect(prepared.success && prepared.payload.plan).toBeUndefined();
    });

    it('leaves out inputs that already have a signed transaction in this session', async () => {
        const { ledger, prepare, utxos } = setup(['100000', '250000']);
        const first = await prepare();
        if (!first.success || !first.payload.plan) throw new Error('expected a plan');

        ledger.recordSigned({
            hex: 'signed',
            txid: '0'.repeat(64),
            account: { accountType: 'p2pkh', accountIndex: 0, path: [], xpub: '', descriptor: '' },
            plan: first.payload.plan,
            outpoints: [getOutpointKey(utxos[1]!)],
        });

        const second = await prepare();

        expect(second.success && second.payload.plan?.utxos.map(getOutpointKey)).toEqual([
            getOutpointKey(utxos[0]!),
        ]);
    });

    it('composes nothing while the backend data is ambiguous', async () => {
        const { chain, account, ledger, prepare, utxos } = setup(['100000', '250000']);
        const info = chain.accountInfos.get(account.descriptor)!;
        chain.accountInfos.set(account.descriptor, {
            ...info,
            history: {
                total: 3,
                unconfirmed: 1,
                transactions: [
                    mockHistoryTransaction({
                        blockHeight: -1,
                        details: {
                            vin: [{ txid: utxos[0]!.txid, n: 0, isAddress: true }],
                            vout: [],
                            size: 0,
                            totalInput: '0',
                            totalOutput: '0',
                        },
                    }),
                ],
            },
        });

        expect(await prepare()).toEqual({
            success: false,
            error: { type: 'ambiguous-state', reasons: ['utxo-spent-in-mempool'] },
        });
        expect(ledger.getUsedAmounts().size).toBe(0);
    });

    it('passes a backend failure through', async () => {
        const { chain, prepare } = setup(['100000']);
        chain.backend.getAccountUtxo.mockResolvedValue({
            success: false,
            error: { type: 'backend', message: 'offline' },
        });

        expect(await prepare()).toEqual({
            success: false,
            error: { type: 'backend', message: 'offline' },
        });
    });
});
