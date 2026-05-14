import { type Account } from '@suite-common/wallet-types';

import {
    compareYieldRowsByAvailableBalanceDesc,
    compareYieldRowsByNetworkOnly,
    compareYieldRowsBySuppliedAmountDesc,
    compareYieldRowsByTokenNetworkOrder,
} from '../earnYieldUtils';

type Row = {
    id: string;
    account?: Pick<Account, 'symbol' | 'accountType' | 'index'>;
    suppliedSymbol?: string;
};

const row = (
    id: string,
    symbol: Account['symbol'],
    index: number,
    accountType: Account['accountType'] = 'normal',
    suppliedSymbol?: string,
): Row => ({
    id,
    account: { symbol, accountType, index },
    suppliedSymbol,
});

describe('compareYieldRowsByNetworkOnly', () => {
    it('groups rows by network in networkSymbolCollection order', () => {
        const sorted = [
            row('op-0', 'op', 0),
            row('eth-0', 'eth', 0),
            row('op-1', 'op', 1),
            row('eth-1', 'eth', 1),
        ].toSorted(compareYieldRowsByNetworkOnly);

        const symbols = sorted.map(r => r.account?.symbol);
        expect(symbols.lastIndexOf('eth')).toBeLessThan(symbols.indexOf('op'));
    });

    it('preserves input order within the same network (stable sort)', () => {
        const sorted = [
            row('eth-3', 'eth', 3),
            row('eth-0', 'eth', 0),
            row('eth-2', 'eth', 2),
        ].toSorted(compareYieldRowsByNetworkOnly);

        expect(sorted.map(r => r.id)).toEqual(['eth-3', 'eth-0', 'eth-2']);
    });

    it('keeps suppliedAmount-desc within each network when chained with compareYieldRowsBySuppliedAmountDesc', () => {
        const rows = [
            {
                id: 'eth-0-50',
                account: { symbol: 'eth' as const, accountType: 'normal' as const, index: 0 },
                suppliedAmount: '50',
            },
            {
                id: 'op-0-75',
                account: { symbol: 'op' as const, accountType: 'normal' as const, index: 0 },
                suppliedAmount: '75',
            },
            {
                id: 'eth-1-100',
                account: { symbol: 'eth' as const, accountType: 'normal' as const, index: 1 },
                suppliedAmount: '100',
            },
            {
                id: 'op-1-25',
                account: { symbol: 'op' as const, accountType: 'normal' as const, index: 1 },
                suppliedAmount: '25',
            },
        ];

        const sorted = rows
            .toSorted(compareYieldRowsBySuppliedAmountDesc)
            .toSorted(compareYieldRowsByNetworkOnly);

        expect(sorted.map(r => r.id)).toEqual(['eth-1-100', 'eth-0-50', 'op-0-75', 'op-1-25']);
    });

    it('treats rows without an account as equal (no reordering)', () => {
        const rows: Row[] = [
            { id: 'a' },
            row('eth-0', 'eth', 0),
            { id: 'b' },
            row('eth-1', 'eth', 1),
        ];

        const sorted = rows.toSorted(compareYieldRowsByNetworkOnly);

        expect(sorted.map(r => r.id)).toEqual(['a', 'eth-0', 'b', 'eth-1']);
    });
});

describe('compareYieldRowsByTokenNetworkOrder', () => {
    it('groups by network → token → accountType → index so legacy/ledger rows stay with normal rows on the same token', () => {
        const sorted = [
            row('eth-1-legacy-usdc', 'eth', 1, 'legacy', 'usdc'),
            row('eth-9-normal-usdt', 'eth', 9, 'normal', 'usdt'),
            row('eth-1-ledger-usdc', 'eth', 1, 'ledger', 'usdc'),
            row('eth-1-normal-usdc', 'eth', 1, 'normal', 'usdc'),
            row('eth-9-ledger-usdt', 'eth', 9, 'ledger', 'usdt'),
            row('eth-1-normal-usdt', 'eth', 1, 'normal', 'usdt'),
        ].toSorted(compareYieldRowsByTokenNetworkOrder);

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
        ].toSorted(compareYieldRowsByTokenNetworkOrder);

        expect(sorted.map(r => r.id)).toEqual(['eth-9-normal-usdt', 'eth-1-legacy-usdt']);
    });

    it('puts ledger account #9 before legacy account #1 (accountType config order: ledger before legacy)', () => {
        const sorted = [
            row('eth-1-legacy-usdt', 'eth', 1, 'legacy', 'usdt'),
            row('eth-9-ledger-usdt', 'eth', 9, 'ledger', 'usdt'),
        ].toSorted(compareYieldRowsByTokenNetworkOrder);

        expect(sorted.map(r => r.id)).toEqual(['eth-9-ledger-usdt', 'eth-1-legacy-usdt']);
    });

    it('groups all USDT together within an accountType block (token before index)', () => {
        const sorted = [
            row('eth-3-normal-usdt', 'eth', 3, 'normal', 'usdt'),
            row('eth-1-normal-usdc', 'eth', 1, 'normal', 'usdc'),
            row('eth-1-normal-usdt', 'eth', 1, 'normal', 'usdt'),
            row('eth-5-normal-usdc', 'eth', 5, 'normal', 'usdc'),
        ].toSorted(compareYieldRowsByTokenNetworkOrder);

        expect(sorted.map(r => r.id)).toEqual([
            'eth-1-normal-usdc',
            'eth-5-normal-usdc',
            'eth-1-normal-usdt',
            'eth-3-normal-usdt',
        ]);
    });
});

describe('yield table 3-bucket ordering', () => {
    it('renders deposited (suppliedAmount-desc by network), then depositable + no-balance (both share network → accountType → token → index)', () => {
        const depositedBaseRow = (
            id: string,
            symbol: 'eth' | 'op',
            index: number,
            suppliedAmount: string,
        ) => ({
            id,
            account: { symbol, accountType: 'normal' as const, index },
            suppliedAmount,
        });

        const depositableBaseRow = (
            id: string,
            symbol: 'eth' | 'op',
            accountType: Account['accountType'],
            index: number,
            suppliedSymbol: string,
            additionalSupplyAmount: string,
        ) => ({
            id,
            account: { symbol, accountType, index, formattedBalance: '0' },
            suppliedSymbol,
            additionalSupplyAmount,
            matchedInputToken: {},
        });

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
                .toSorted(compareYieldRowsBySuppliedAmountDesc)
                .toSorted(compareYieldRowsByNetworkOnly),
            ...depositableRows
                .toSorted(compareYieldRowsByAvailableBalanceDesc)
                .toSorted(compareYieldRowsByTokenNetworkOrder),
            ...noBalanceRows.toSorted(compareYieldRowsByTokenNetworkOrder),
        ];

        expect(ordered.map(r => r.id)).toEqual([
            // deposited (group 1): suppliedAmount-desc within network
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
