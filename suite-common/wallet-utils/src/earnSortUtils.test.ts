import { type AccountType, type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { mockGetSupportedNetworks } from '@suite-common/wallet-config/mocks';
import { type Account } from '@suite-common/wallet-types';

import {
    compareEarnByAmountDesc,
    compareEarnByApyDesc,
    compareEarnByNetwork,
    compareEarnByNetworkTokenOrder,
} from './earnSortUtils';

const supportedNetworks = mockGetSupportedNetworks();

const ethSymbol = asNetworkSymbol('eth');
const opSymbol = asNetworkSymbol('op');

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
            row('op-0', opSymbol, 0),
            row('eth-0', ethSymbol, 0),
            row('op-1', opSymbol, 1),
            row('eth-1', ethSymbol, 1),
        ].toSorted(compareEarnByNetwork(getRowSymbol, supportedNetworks));

        const symbols = sorted.map(r => r.account?.symbol);
        expect(symbols.lastIndexOf(ethSymbol)).toBeLessThan(symbols.indexOf(opSymbol));
    });

    it('keeps amount-desc within each network when chained with compareEarnByAmountDesc', () => {
        const rows = [
            { id: 'eth-0-50', symbol: ethSymbol, depositedAmount: '50' },
            { id: 'op-0-75', symbol: opSymbol, depositedAmount: '75' },
            { id: 'eth-1-100', symbol: ethSymbol, depositedAmount: '100' },
            { id: 'op-1-25', symbol: opSymbol, depositedAmount: '25' },
        ];

        const sorted = rows
            .toSorted(compareEarnByAmountDesc(r => r.depositedAmount))
            .toSorted(compareEarnByNetwork(r => r.symbol, supportedNetworks));

        expect(sorted.map(r => r.id)).toEqual(['eth-1-100', 'eth-0-50', 'op-0-75', 'op-1-25']);
    });

    it('treats rows without an account as equal (no reordering)', () => {
        const rows: Row[] = [
            { id: 'a' },
            row('eth-0', ethSymbol, 0),
            { id: 'b' },
            row('eth-1', ethSymbol, 1),
        ];

        const sorted = rows.toSorted(compareEarnByNetwork(getRowSymbol, supportedNetworks));

        expect(sorted.map(r => r.id)).toEqual(['a', 'eth-0', 'b', 'eth-1']);
    });
});

describe('compareEarnByNetworkTokenOrder', () => {
    it('groups by network → token → accountType → index so legacy/ledger rows stay with normal rows on the same token', () => {
        const sorted = [
            row('op-0-normal-usdc', opSymbol, 0, 'normal', 'usdc'),
            row('eth-1-legacy-usdc', ethSymbol, 1, 'legacy', 'usdc'),
            row('eth-9-normal-usdt', ethSymbol, 9, 'normal', 'usdt'),
            row('eth-1-ledger-usdc', ethSymbol, 1, 'ledger', 'usdc'),
            row('eth-1-normal-usdc', ethSymbol, 1, 'normal', 'usdc'),
            row('eth-9-ledger-usdt', ethSymbol, 9, 'ledger', 'usdt'),
            row('eth-1-normal-usdt', ethSymbol, 1, 'normal', 'usdt'),
        ].toSorted(compareEarnByNetworkTokenOrder(getRowNetworkTokenKey, supportedNetworks));

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
            // OP block
            'op-0-normal-usdc',
        ]);
    });

    it('puts normal account #9 before legacy account #1 (accountType beats index)', () => {
        const sorted = [
            row('eth-1-legacy-usdt', ethSymbol, 1, 'legacy', 'usdt'),
            row('eth-9-normal-usdt', ethSymbol, 9, 'normal', 'usdt'),
        ].toSorted(compareEarnByNetworkTokenOrder(getRowNetworkTokenKey, supportedNetworks));

        expect(sorted.map(r => r.id)).toEqual(['eth-9-normal-usdt', 'eth-1-legacy-usdt']);
    });

    it('groups all USDT together within an accountType block (token before index)', () => {
        const sorted = [
            row('eth-3-normal-usdt', ethSymbol, 3, 'normal', 'usdt'),
            row('eth-1-normal-usdc', ethSymbol, 1, 'normal', 'usdc'),
            row('eth-1-normal-usdt', ethSymbol, 1, 'normal', 'usdt'),
            row('eth-5-normal-usdc', ethSymbol, 5, 'normal', 'usdc'),
        ].toSorted(compareEarnByNetworkTokenOrder(getRowNetworkTokenKey, supportedNetworks));

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
            row('eth-0', ethSymbol, 0, 'normal', 'usdc'),
            { id: 'b' },
            row('eth-1', ethSymbol, 1, 'normal', 'usdc'),
        ];

        const sorted = rows.toSorted(
            compareEarnByNetworkTokenOrder(getRowNetworkTokenKey, supportedNetworks),
        );

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
