import { type AccountType, type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import {
    compareEarnByAmountDesc,
    compareEarnByApyDesc,
    compareEarnByNetwork,
    compareEarnByNetworkTokenOrder,
} from './earnSortUtils';

type Row = {
    id: string;
    account?: Pick<Account, 'symbol' | 'accountType' | 'index'>;
    depositedSymbol?: string;
};

const row = (
    id: string,
    symbol: NetworkSymbol,
    index: number,
    accountType: AccountType = 'normal',
    depositedSymbol?: string,
): Row => ({
    id,
    account: { symbol, accountType, index },
    depositedSymbol,
});

const getRowSymbol = (r: Row) => r.account?.symbol;

const getRowNetworkTokenKey = (r: Row) =>
    r.account && {
        symbol: r.account.symbol,
        tokenSymbol: r.depositedSymbol,
        accountType: r.account.accountType,
        index: r.account.index,
    };

describe('compareEarnByNetwork', () => {
    it('groups rows by network in networkSymbolCollection order', () => {
        const sorted = [
            row('op-0', 'op', 0),
            row('eth-0', 'eth', 0),
            row('op-1', 'op', 1),
            row('eth-1', 'eth', 1),
        ].toSorted(compareEarnByNetwork(getRowSymbol));

        const symbols = sorted.map(r => r.account?.symbol);
        expect(symbols.lastIndexOf('eth')).toBeLessThan(symbols.indexOf('op'));
    });

    it('preserves input order within the same network (stable sort)', () => {
        const sorted = [
            row('eth-3', 'eth', 3),
            row('eth-0', 'eth', 0),
            row('eth-2', 'eth', 2),
        ].toSorted(compareEarnByNetwork(getRowSymbol));

        expect(sorted.map(r => r.id)).toEqual(['eth-3', 'eth-0', 'eth-2']);
    });

    it('keeps amount-desc within each network when chained with compareEarnByAmountDesc', () => {
        const rows = [
            {
                id: 'eth-0-50',
                account: { symbol: 'eth' as const, accountType: 'normal' as const, index: 0 },
                depositedAmount: '50',
            },
            {
                id: 'op-0-75',
                account: { symbol: 'op' as const, accountType: 'normal' as const, index: 0 },
                depositedAmount: '75',
            },
            {
                id: 'eth-1-100',
                account: { symbol: 'eth' as const, accountType: 'normal' as const, index: 1 },
                depositedAmount: '100',
            },
            {
                id: 'op-1-25',
                account: { symbol: 'op' as const, accountType: 'normal' as const, index: 1 },
                depositedAmount: '25',
            },
        ];

        const sorted = rows
            .toSorted(compareEarnByAmountDesc(r => r.depositedAmount))
            .toSorted(compareEarnByNetwork(r => r.account.symbol));

        expect(sorted.map(r => r.id)).toEqual(['eth-1-100', 'eth-0-50', 'op-0-75', 'op-1-25']);
    });

    it('treats rows without an account as equal (no reordering)', () => {
        const rows: Row[] = [
            { id: 'a' },
            row('eth-0', 'eth', 0),
            { id: 'b' },
            row('eth-1', 'eth', 1),
        ];

        const sorted = rows.toSorted(compareEarnByNetwork(getRowSymbol));

        expect(sorted.map(r => r.id)).toEqual(['a', 'eth-0', 'b', 'eth-1']);
    });
});

describe('compareEarnByNetworkTokenOrder', () => {
    it('groups by network → token → accountType → index so legacy/ledger rows stay with normal rows on the same token', () => {
        const sorted = [
            row('eth-1-legacy-usdc', 'eth', 1, 'legacy', 'usdc'),
            row('eth-9-normal-usdt', 'eth', 9, 'normal', 'usdt'),
            row('eth-1-ledger-usdc', 'eth', 1, 'ledger', 'usdc'),
            row('eth-1-normal-usdc', 'eth', 1, 'normal', 'usdc'),
            row('eth-9-ledger-usdt', 'eth', 9, 'ledger', 'usdt'),
            row('eth-1-normal-usdt', 'eth', 1, 'normal', 'usdt'),
        ].toSorted(compareEarnByNetworkTokenOrder(getRowNetworkTokenKey));

        // ETH accountTypes config: { ledger, legacy }. 'normal' indexOf returns -1 → sorts first.
        // Token (alphabetical) → accountType (normal → ledger → legacy) → index.
        expect(sorted.map(r => r.id)).toEqual([
            // USDC block
            'eth-1-normal-usdc',
            'eth-1-ledger-usdc',
            'eth-1-legacy-usdc',
            // USDT block
            'eth-1-normal-usdt',
            'eth-9-normal-usdt',
            'eth-9-ledger-usdt',
        ]);
    });

    it('puts normal account #9 before legacy account #1 (accountType beats index)', () => {
        const sorted = [
            row('eth-1-legacy-usdt', 'eth', 1, 'legacy', 'usdt'),
            row('eth-9-normal-usdt', 'eth', 9, 'normal', 'usdt'),
        ].toSorted(compareEarnByNetworkTokenOrder(getRowNetworkTokenKey));

        expect(sorted.map(r => r.id)).toEqual(['eth-9-normal-usdt', 'eth-1-legacy-usdt']);
    });

    it('puts ledger account #9 before legacy account #1 (accountType config order: ledger before legacy)', () => {
        const sorted = [
            row('eth-1-legacy-usdt', 'eth', 1, 'legacy', 'usdt'),
            row('eth-9-ledger-usdt', 'eth', 9, 'ledger', 'usdt'),
        ].toSorted(compareEarnByNetworkTokenOrder(getRowNetworkTokenKey));

        expect(sorted.map(r => r.id)).toEqual(['eth-9-ledger-usdt', 'eth-1-legacy-usdt']);
    });

    it('groups all USDT together within an accountType block (token before index)', () => {
        const sorted = [
            row('eth-3-normal-usdt', 'eth', 3, 'normal', 'usdt'),
            row('eth-1-normal-usdc', 'eth', 1, 'normal', 'usdc'),
            row('eth-1-normal-usdt', 'eth', 1, 'normal', 'usdt'),
            row('eth-5-normal-usdc', 'eth', 5, 'normal', 'usdc'),
        ].toSorted(compareEarnByNetworkTokenOrder(getRowNetworkTokenKey));

        expect(sorted.map(r => r.id)).toEqual([
            'eth-1-normal-usdc',
            'eth-5-normal-usdc',
            'eth-1-normal-usdt',
            'eth-3-normal-usdt',
        ]);
    });

    it('treats rows without an account as equal (no reordering)', () => {
        const rows: Row[] = [
            { id: 'a' },
            row('eth-0', 'eth', 0, 'normal', 'usdc'),
            { id: 'b' },
            row('eth-1', 'eth', 1, 'normal', 'usdc'),
        ];

        const sorted = rows.toSorted(compareEarnByNetworkTokenOrder(getRowNetworkTokenKey));

        expect(sorted.map(r => r.id)).toEqual(['a', 'eth-0', 'b', 'eth-1']);
    });
});

describe('compareEarnByApyDesc', () => {
    it('orders opportunities by APY descending', () => {
        const sorted = [
            { id: 'a', apy: 3 },
            { id: 'b', apy: 10 },
            { id: 'c', apy: 5 },
        ].toSorted(compareEarnByApyDesc(item => item.apy));

        expect(sorted.map(item => item.id)).toEqual(['b', 'c', 'a']);
    });

    it('puts null/undefined APY last and keeps their relative order stable', () => {
        const sorted = [
            { id: 'a', apy: null },
            { id: 'b', apy: 10 },
            { id: 'c', apy: undefined },
            { id: 'd', apy: 5 },
        ].toSorted(compareEarnByApyDesc(item => item.apy));

        expect(sorted.map(item => item.id)).toEqual(['b', 'd', 'a', 'c']);
    });
});

describe('yield bucket ordering', () => {
    it('renders deposited (amount-desc by network), then depositable + no-balance (both share network → token → accountType → index)', () => {
        const depositedBaseRow = (
            id: string,
            symbol: 'eth' | 'op',
            index: number,
            depositedAmount: string,
        ) => ({
            id,
            account: { symbol, accountType: 'normal' as const, index },
            depositedAmount,
        });

        const depositableBaseRow = (
            id: string,
            symbol: 'eth' | 'op',
            accountType: AccountType,
            index: number,
            depositedSymbol: string,
            additionalDepositAmount: string,
        ) => ({
            id,
            account: { symbol, accountType, index, formattedBalance: '0' },
            depositedSymbol,
            additionalDepositAmount,
            matchedInputToken: {},
        });

        const getAvailableBalance = (r: {
            matchedInputToken?: unknown;
            additionalDepositAmount?: string;
            account?: { formattedBalance?: string };
        }) =>
            r.matchedInputToken
                ? (r.additionalDepositAmount ?? '0')
                : (r.account?.formattedBalance ?? '0');

        const toNetworkTokenKey = (r: {
            account?: { symbol: NetworkSymbol; accountType: AccountType; index: number };
            depositedSymbol?: string;
        }) =>
            r.account && {
                symbol: r.account.symbol,
                tokenSymbol: r.depositedSymbol,
                accountType: r.account.accountType,
                index: r.account.index,
            };

        const depositedRows = [
            depositedBaseRow('eth-2-deposited-200', 'eth', 2, '200'),
            depositedBaseRow('eth-0-deposited-500', 'eth', 0, '500'),
            depositedBaseRow('op-3-deposited-100', 'op', 3, '100'),
        ];
        const depositableRows = [
            depositableBaseRow('eth-3-depositable-normal-usdt', 'eth', 'normal', 3, 'usdt', '50'),
            depositableBaseRow('eth-0-depositable-normal-usdc', 'eth', 'normal', 0, 'usdc', '300'),
            depositableBaseRow('eth-1-depositable-ledger-usdt', 'eth', 'ledger', 1, 'usdt', '10'),
            depositableBaseRow('op-0-depositable-normal-usdc', 'op', 'normal', 0, 'usdc', '75'),
        ];
        const noBalanceRows = [
            row('eth-7-no-balance-normal-usdt', 'eth', 7, 'normal', 'usdt'),
            row('eth-1-no-balance-normal-usdc', 'eth', 1, 'normal', 'usdc'),
            row('eth-1-no-balance-legacy-usdc', 'eth', 1, 'legacy', 'usdc'),
            row('op-2-no-balance-normal-usdc', 'op', 2, 'normal', 'usdc'),
            row('eth-1-no-balance-ledger-usdt', 'eth', 1, 'ledger', 'usdt'),
            row('eth-4-no-balance-normal-usdc', 'eth', 4, 'normal', 'usdc'),
        ];

        const ordered = [
            ...depositedRows
                .toSorted(compareEarnByAmountDesc(r => r.depositedAmount))
                .toSorted(compareEarnByNetwork(r => r.account.symbol)),
            ...depositableRows
                .toSorted(compareEarnByAmountDesc(getAvailableBalance))
                .toSorted(compareEarnByNetworkTokenOrder(toNetworkTokenKey)),
            ...noBalanceRows.toSorted(compareEarnByNetworkTokenOrder(toNetworkTokenKey)),
        ];

        expect(ordered.map(r => r.id)).toEqual([
            // deposited (group 1): amount-desc within network
            'eth-0-deposited-500',
            'eth-2-deposited-200',
            'op-3-deposited-100',
            // depositable (group 2): network → token → accountType → index
            'eth-0-depositable-normal-usdc',
            'eth-3-depositable-normal-usdt',
            'eth-1-depositable-ledger-usdt',
            'op-0-depositable-normal-usdc',
            // no-balance (group 3): same chain as depositable — same network+token grouped together
            //   ETH USDC block (normal by index, then legacy)
            'eth-1-no-balance-normal-usdc',
            'eth-4-no-balance-normal-usdc',
            'eth-1-no-balance-legacy-usdc',
            //   ETH USDT block (normal, then ledger)
            'eth-7-no-balance-normal-usdt',
            'eth-1-no-balance-ledger-usdt',
            //   OP USDC block
            'op-2-no-balance-normal-usdc',
        ]);
    });
});
