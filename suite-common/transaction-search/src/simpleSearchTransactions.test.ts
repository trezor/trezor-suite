import { testMocks } from '@suite-common/test-utils';

import { type SearchAccountLabels } from './searchLabels';
import { simpleSearchTransactions } from './simpleSearchTransactions';

const { getWalletTransaction } = testMocks;

const emptyLabels: SearchAccountLabels = {
    outputLabels: new Map(),
    addressLabels: new Map(),
    accountLabel: null,
};

describe(simpleSearchTransactions.name, () => {
    it('finds transactions with native balance change by native display symbol', () => {
        const transaction = getWalletTransaction({ txid: 'aaa1' });

        const result = simpleSearchTransactions([transaction], emptyLabels, 'BTC');

        expect(result).toEqual([transaction]);
    });

    it('does not match token-only transactions by native display symbol', () => {
        const transaction = getWalletTransaction({
            symbol: 'eth',
            txid: 'aaa2',
            amount: '0',
            tokens: [
                {
                    type: 'sent',
                    standard: 'ERC20',
                    contract: '0xdac17f958d2ee523a2206206994597c13d831ec7',
                    name: 'Tether',
                    symbol: 'USDT',
                    decimals: 6,
                    amount: '100',
                    from: '0x1',
                    to: '0x2',
                },
            ],
        });

        expect(simpleSearchTransactions([transaction], emptyLabels, 'ETH')).toEqual([]);
    });

    it('does not match token-only transactions by native display symbol even when token symbol or name contain it', () => {
        const transaction = getWalletTransaction({
            symbol: 'eth',
            txid: 'aaa6',
            type: 'contract',
            amount: '0',
            tokens: [
                {
                    type: 'sent',
                    standard: 'ERC20',
                    contract: '0xfc36ca4a35b0a10a521bd08bfe4e26df94e364f5',
                    name: 'Trezor Staked ETH',
                    symbol: 'trSHETHp',
                    decimals: 18,
                    amount: '0.00033333',
                    from: '0x1',
                    to: '0x2',
                },
                {
                    type: 'recv',
                    standard: 'ERC20',
                    contract: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                    name: 'Wrapped Ether',
                    symbol: 'WETH',
                    decimals: 18,
                    amount: '0.000334',
                    from: '0x2',
                    to: '0x1',
                },
            ],
        });

        expect(simpleSearchTransactions([transaction], emptyLabels, 'ETH')).toEqual([]);
    });

    it('matches contract transactions with native amount by native display symbol', () => {
        const transaction = getWalletTransaction({
            symbol: 'eth',
            txid: 'aaa7',
            type: 'contract',
            amount: '1.5',
        });

        expect(simpleSearchTransactions([transaction], emptyLabels, 'ETH')).toEqual([transaction]);
    });

    it('does not match fee-only self transactions by native display symbol', () => {
        const transaction = getWalletTransaction({ txid: 'aaa3', type: 'self', amount: '144' });

        expect(simpleSearchTransactions([transaction], emptyLabels, 'BTC')).toEqual([]);
    });

    it('matches transactions with native internal transfers by native display symbol', () => {
        const transaction = getWalletTransaction({
            symbol: 'eth',
            txid: 'aaa4',
            amount: '0',
            internalTransfers: [{ type: 'recv', from: '0x1', to: '0x2', amount: '5' }],
        });

        const result = simpleSearchTransactions([transaction], emptyLabels, 'ETH');

        expect(result).toEqual([transaction]);
    });

    it('still finds token transactions by token symbol', () => {
        const transaction = getWalletTransaction({
            symbol: 'eth',
            txid: 'aaa5',
            amount: '0',
            tokens: [
                {
                    type: 'sent',
                    standard: 'ERC20',
                    contract: '0xdac17f958d2ee523a2206206994597c13d831ec7',
                    name: 'Tether',
                    symbol: 'USDT',
                    decimals: 6,
                    amount: '100',
                    from: '0x1',
                    to: '0x2',
                },
            ],
        });

        const result = simpleSearchTransactions([transaction], emptyLabels, 'USDT');

        expect(result).toEqual([transaction]);
    });
});
