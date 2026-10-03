import { testMocks } from '@suite-common/test-utils';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import {
    type RecipientHistory,
    getRecipientHistory,
    getRecipientRisk,
    isLookalikeAddress,
    isRecipientHistoryCheckSupported,
} from './recipientHistory';

const OWN = '0x1111111111111111111111111111111111111111';
// L is an address the user paid, P a poisoner's vanity address sharing its first 3 and last 4 hex.
const LEGIT = '0xAbC0000000000000000000000000000000001234';
const POISON = '0xabc9999999999999999999999999999999991234';
const STRANGER = '0x2222222222222222222222222222222222222222';

const getVinVout = (address: string) => ({ addresses: [address], isAddress: true, n: 0 });

const getTransaction = ({
    from,
    to,
    isPhishing = false,
}: {
    from: string;
    to: string;
    isPhishing?: boolean;
}) =>
    testMocks.getWalletTransaction({
        symbol: 'eth',
        txid: isPhishing ? `phishing-${from}-${to}` : `${from}-${to}`,
        targets: [],
        details: {
            vin: [getVinVout(from)],
            vout: [getVinVout(to)],
            size: 0,
            totalInput: '0',
            totalOutput: '0',
        },
    });

const getHistory = (transactions: WalletAccountTransaction[]) =>
    getRecipientHistory({
        transactions,
        descriptor: OWN,
        networkType: 'ethereum',
        isPhishing: transaction => transaction.txid.startsWith('phishing-'),
    });

const getRisk = (address: string, history: RecipientHistory) =>
    getRecipientRisk({ address, history, networkType: 'ethereum' });

describe('isRecipientHistoryCheckSupported', () => {
    it.each(['ethereum', 'tron'] as const)('checks recipients on %s', networkType => {
        expect(isRecipientHistoryCheckSupported(networkType)).toBe(true);
    });

    it.each(['bitcoin', 'cardano', 'ripple', 'solana', 'stellar'] as const)(
        'does not check recipients on %s',
        networkType => {
            expect(isRecipientHistoryCheckSupported(networkType)).toBe(false);
        },
    );
});

describe('isLookalikeAddress', () => {
    it('matches a different EVM address sharing the first 3 and last 4 hex, ignoring case', () => {
        expect(isLookalikeAddress(LEGIT, POISON, 'ethereum')).toBe(true);
    });

    it('does not match the same address', () => {
        expect(isLookalikeAddress(LEGIT, LEGIT.toLowerCase(), 'ethereum')).toBe(false);
    });

    it.each([
        ['only the first 2 hex match', '0xab09999999999999999999999999999999991234'],
        ['only the last 3 hex match', '0xabc9999999999999999999999999999999990234'],
    ])('does not match when %s', (_description, address) => {
        expect(isLookalikeAddress(LEGIT, address, 'ethereum')).toBe(false);
    });

    it('does not count the fixed leading T of Tron addresses', () => {
        expect(
            isLookalikeAddress(
                'TAb0000000000000000000000000001234',
                'TAx9999999999999999999999999991234',
                'tron',
            ),
        ).toBe(false);
        expect(
            isLookalikeAddress(
                'TAbc000000000000000000000000001234',
                'TAbc999999999999999999999999991234',
                'tron',
            ),
        ).toBe(true);
    });
});

describe('getRecipientRisk', () => {
    it('does not warn about an address the user has paid, even with a lookalike in the history', () => {
        const history = getHistory([
            getTransaction({ from: OWN, to: LEGIT }),
            getTransaction({ from: POISON, to: OWN, isPhishing: true }),
        ]);

        expect(getRisk(LEGIT, history)).toBeUndefined();
    });

    it('warns about poisoning when the address looks like one the user has paid', () => {
        const history = getHistory([getTransaction({ from: OWN, to: LEGIT })]);

        expect(getRisk(POISON, history)).toBe('poisoning');
    });

    it('warns about poisoning when a lookalike sent the user funds, so it is not trusted', () => {
        const history = getHistory([
            getTransaction({ from: LEGIT, to: OWN }),
            getTransaction({ from: POISON, to: OWN }),
        ]);

        expect(getRisk(POISON, history)).toBe('poisoning');
    });

    it('warns about poisoning when the address only appears in phishing transactions', () => {
        const history = getHistory([
            getTransaction({ from: OWN, to: LEGIT }),
            getTransaction({ from: STRANGER, to: OWN, isPhishing: true }),
        ]);

        expect(getRisk(STRANGER, history)).toBe('poisoning');
    });

    it('does not trust the recipient of a spoofed transfer out of the user account', () => {
        // Zero-value transferFrom spoofs are listed as sent, but the user never signed them.
        const history = getHistory([
            getTransaction({ from: STRANGER, to: POISON }),
            getTransaction({ from: OWN, to: LEGIT }),
        ]);

        expect(getRisk(POISON, history)).toBe('poisoning');
    });

    it('does not warn about an address that sent the user funds', () => {
        const history = getHistory([getTransaction({ from: STRANGER, to: OWN })]);

        expect(getRisk(STRANGER, history)).toBeUndefined();
    });

    it('flags an address missing from the history as new', () => {
        const history = getHistory([getTransaction({ from: OWN, to: LEGIT })]);

        expect(getRisk(STRANGER, history)).toBe('new');
    });

    it('does not flag anything while the account history is not loaded', () => {
        expect(getRisk(STRANGER, getHistory([]))).toBeUndefined();
    });

    it('ignores the case of EVM addresses', () => {
        const history = getHistory([getTransaction({ from: OWN, to: LEGIT })]);

        expect(getRisk(LEGIT.toLowerCase(), history)).toBeUndefined();
    });
});

describe('getRecipientHistory', () => {
    it('collects counterparties of token transfers', () => {
        const transaction = {
            ...getTransaction({ from: OWN, to: STRANGER }),
            tokens: [
                {
                    type: 'sent',
                    standard: 'ERC20',
                    contract: STRANGER,
                    from: OWN,
                    to: LEGIT,
                    decimals: 6,
                    amount: '1',
                },
            ],
        } as WalletAccountTransaction;

        expect(getRisk(LEGIT, getHistory([transaction]))).toBeUndefined();
    });
});
