import type { Transfer } from './migrationState';
import { getMigrationOutcome, summarizeTransfers } from './transferSummary';
import { mockBackend, mockFundedAccount } from '../../mocks/mockBackend';
import { mockWallet } from '../../mocks/mockWallet';
import { composeSweep } from '../bitcoin/composeSweep';
import { validateDestination } from '../bitcoin/destinationAddress';

const DESTINATION = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';

const setup = () => {
    const { account, utxos } = mockFundedAccount({
        chain: mockBackend(),
        wallet: mockWallet(),
        accountType: 'p2pkh',
        amounts: ['100000', '200000'],
    });
    const destination = validateDestination({
        input: DESTINATION,
        firmwareVersion: [1, 6, 3],
        ownScripts: new Set(),
    });
    if (!destination.success) throw new Error('test destination must be valid');

    const plan = composeSweep({
        utxos,
        accountType: 'p2pkh',
        destination: destination.payload,
        firmwareVersion: [1, 6, 3],
        usedAmounts: new Set(),
        getRandomInt: () => 5,
    });
    if (!plan.success) throw new Error('test plan must compose');

    const mockTransfer = (overrides: Partial<Transfer> = {}): Transfer => ({
        key: 'p2pkh-0-1',
        account,
        stage: 'ready',
        plan: plan.payload,
        leftovers: [],
        followingTransactions: 0,
        inFlightTransactions: 0,
        ...overrides,
    });

    return { mockTransfer, utxos };
};

describe(summarizeTransfers.name, () => {
    it('reports everything confirmed when every transfer is', () => {
        const { mockTransfer } = setup();

        expect(
            summarizeTransfers([mockTransfer({ stage: 'broadcast', status: 'confirmed' })]),
        ).toMatchObject({ isEverythingConfirmed: true, hasPending: false, notSent: [] });
    });

    it('does not claim a confirmed transfer while one is still pending', () => {
        const { mockTransfer } = setup();

        expect(
            summarizeTransfers([
                mockTransfer({ stage: 'broadcast', status: 'confirmed' }),
                mockTransfer({ key: 'second', stage: 'broadcast', status: 'pending' }),
            ]),
        ).toMatchObject({ isEverythingConfirmed: false, hasPending: true });
    });

    it('counts an account that failed to prepare as not transferred', () => {
        const { mockTransfer } = setup();
        const failed = mockTransfer({
            key: 'failed',
            plan: undefined,
            error: { type: 'backend', message: 'offline' },
        });

        expect(
            summarizeTransfers([mockTransfer({ stage: 'broadcast', status: 'confirmed' }), failed]),
        ).toMatchObject({ isEverythingConfirmed: false, hasPending: false, notSent: [failed] });
    });

    it('ignores an account that holds nothing to move', () => {
        const { mockTransfer } = setup();

        expect(
            summarizeTransfers([
                mockTransfer({ stage: 'broadcast', status: 'confirmed' }),
                mockTransfer({ key: 'empty', plan: undefined }),
            ]),
        ).toMatchObject({ isEverythingConfirmed: true, notSent: [] });
    });

    it.each(['ready', 'signed'] as const)(
        'counts a transfer left in the %s stage as not sent',
        stage => {
            const { mockTransfer } = setup();
            const unsent = mockTransfer({ stage });

            expect(summarizeTransfers([unsent])).toMatchObject({
                isEverythingConfirmed: false,
                notSent: [unsent],
            });
        },
    );

    it('treats coins taken by another transaction as settled but not as transferred', () => {
        const { mockTransfer } = setup();

        expect(
            summarizeTransfers([
                mockTransfer({ stage: 'broadcast', status: 'spent-by-another-transaction' }),
            ]),
        ).toMatchObject({ isEverythingConfirmed: false, hasPending: false });
    });

    it('keeps following a transfer that fell out of the network', () => {
        const { mockTransfer } = setup();

        expect(
            summarizeTransfers([mockTransfer({ stage: 'broadcast', status: 'not-in-mempool' })]),
        ).toMatchObject({ isEverythingConfirmed: false, hasPending: true });
    });

    it('lists the amounts of the coins left behind', () => {
        const { mockTransfer, utxos } = setup();
        const leftovers = utxos.map(utxo => ({ utxo, reason: 'uneconomic' as const }));

        expect(
            summarizeTransfers([
                mockTransfer({ stage: 'broadcast', status: 'confirmed', leftovers }),
            ]),
        ).toMatchObject({ isEverythingConfirmed: true, leftoverAmounts: ['100000', '200000'] });
    });
});

describe(getMigrationOutcome.name, () => {
    const confirmed = { hasPending: false, isEverythingConfirmed: true };
    const pending = { hasPending: true, isEverythingConfirmed: false };
    const incomplete = { hasPending: false, isEverythingConfirmed: false };

    it('claims success only when every coin that had something to move is confirmed', () => {
        expect(getMigrationOutcome([confirmed, confirmed])).toBe('confirmed');
        expect(getMigrationOutcome([confirmed, incomplete])).toBe('incomplete');
    });

    it('reports pending while any coin is still being followed', () => {
        expect(getMigrationOutcome([confirmed, pending])).toBe('pending');
    });

    it('does not claim success when nothing was moved', () => {
        expect(getMigrationOutcome([])).toBe('incomplete');
    });
});
