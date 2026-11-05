import { type CryptoId, type ExchangeTrade } from 'invity-api';

import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import {
    getExchangeAllowanceCoverage,
    getExchangeAllowanceKey,
    getExchangeApprovalSpender,
    getExchangeCurrentAllowance,
    isSameExchangeAllowanceKey,
} from './exchangeAllowanceUtils';
import { type TradingExchangeAllowance } from '../../types';

const ACCOUNT_KEY = mockAccountKey({ descriptor: 'owner' });
const OTHER_ACCOUNT_KEY = mockAccountKey({ descriptor: 'otherowner' });
const USDT_CONTRACT = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const SPENDER = '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae';
// ERC-20 `approve(spender, amount)` calldata: selector + 32-byte spender + 32-byte amount.
const APPROVE_CALLDATA = `0x095ea7b3${SPENDER.slice(2).padStart(64, '0')}${'1'.padStart(64, '0')}`;
// ERC-20 `transfer(to, amount)` calldata: a different selector than approve.
const TRANSFER_CALLDATA = `0xa9059cbb${SPENDER.slice(2).padStart(64, '0')}${'1'.padStart(64, '0')}`;

const APPROVAL_QUOTE: ExchangeTrade = {
    send: `ethereum--${USDT_CONTRACT}` as CryptoId,
    status: 'APPROVAL_REQ',
    preapprovedStringAmount: '50',
    dexTx: { from: '0xowner', to: USDT_CONTRACT, value: '0', data: APPROVE_CALLDATA },
};

const KEY = { accountKey: ACCOUNT_KEY, tokenContractAddress: USDT_CONTRACT, spender: SPENDER };

describe('getExchangeApprovalSpender', () => {
    it('reads the spender from the approve calldata of the quote', () => {
        expect(getExchangeApprovalSpender(APPROVAL_QUOTE)?.toLowerCase()).toBe(SPENDER);
    });

    it.each<[string, ExchangeTrade | undefined]>([
        ['no quote', undefined],
        ['a quote without transaction data', { ...APPROVAL_QUOTE, dexTx: undefined }],
        [
            'a quote whose transaction is not an approve',
            {
                ...APPROVAL_QUOTE,
                dexTx: { from: '0xowner', to: USDT_CONTRACT, value: '0', data: TRANSFER_CALLDATA },
            },
        ],
    ])('is undefined for %s', (_description, quote) => {
        expect(getExchangeApprovalSpender(quote)).toBeUndefined();
    });
});

describe('getExchangeAllowanceKey', () => {
    it('builds the key from the account, the sent token and the approve spender', () => {
        const key = getExchangeAllowanceKey({ accountKey: ACCOUNT_KEY, quote: APPROVAL_QUOTE });

        expect(key).toEqual({
            accountKey: ACCOUNT_KEY,
            tokenContractAddress: USDT_CONTRACT,
            spender: expect.any(String),
        });
        expect(key?.spender.toLowerCase()).toBe(SPENDER);
    });

    it.each<
        [string, { accountKey: typeof ACCOUNT_KEY | undefined; quote: ExchangeTrade | undefined }]
    >([
        ['no account', { accountKey: undefined, quote: APPROVAL_QUOTE }],
        ['no quote', { accountKey: ACCOUNT_KEY, quote: undefined }],
        [
            'a native coin send',
            { accountKey: ACCOUNT_KEY, quote: { ...APPROVAL_QUOTE, send: 'ethereum' as CryptoId } },
        ],
        [
            'a quote without approve calldata',
            { accountKey: ACCOUNT_KEY, quote: { ...APPROVAL_QUOTE, dexTx: undefined } },
        ],
    ])('is undefined for %s', (_description, params) => {
        expect(getExchangeAllowanceKey(params)).toBeUndefined();
    });
});

describe('isSameExchangeAllowanceKey', () => {
    it('ignores the address casing', () => {
        expect(
            isSameExchangeAllowanceKey(KEY, {
                ...KEY,
                tokenContractAddress: USDT_CONTRACT.toUpperCase(),
                spender: SPENDER.toUpperCase(),
            }),
        ).toBe(true);
    });

    it.each<[string, Partial<typeof KEY>]>([
        ['account', { accountKey: OTHER_ACCOUNT_KEY }],
        ['token', { tokenContractAddress: '0x6b175474e89094c44da98b954eedeac495271d0f' }],
        ['spender', { spender: '0x1111111111111111111111111111111111111111' }],
    ])('differs by %s', (_part, change) => {
        expect(isSameExchangeAllowanceKey(KEY, { ...KEY, ...change })).toBe(false);
    });
});

describe('getExchangeCurrentAllowance', () => {
    const loadedAllowance: TradingExchangeAllowance = {
        ...KEY,
        status: 'loaded',
        amount: '0',
    };

    it('prefers the allowance read from the chain', () => {
        expect(
            getExchangeCurrentAllowance({ allowance: loadedAllowance, quote: APPROVAL_QUOTE }),
        ).toEqual({ amount: '0', source: 'chain' });
    });

    it.each<[string, TradingExchangeAllowance | undefined]>([
        ['has not been read', undefined],
        ['is being read for the first time', { ...KEY, status: 'loading', amount: undefined }],
        ['could not be read', { ...KEY, status: 'error', amount: undefined }],
    ])('falls back to the provider amount while the chain allowance %s', (_state, allowance) => {
        expect(getExchangeCurrentAllowance({ allowance, quote: APPROVAL_QUOTE })).toEqual({
            amount: '50',
            source: 'provider',
        });
    });

    it('keeps the last chain amount while it is being re-read', () => {
        expect(
            getExchangeCurrentAllowance({
                allowance: { ...KEY, status: 'loading', amount: '20' },
                quote: APPROVAL_QUOTE,
            }),
        ).toEqual({ amount: '20', source: 'chain' });
    });

    it('is zero when neither the chain nor the provider report an allowance', () => {
        expect(
            getExchangeCurrentAllowance({
                allowance: undefined,
                quote: { ...APPROVAL_QUOTE, preapprovedStringAmount: undefined },
            }),
        ).toEqual({ amount: '0', source: 'provider' });
    });
});

describe('getExchangeAllowanceCoverage', () => {
    const USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7';
    const DAI = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const coverage = (amount: string, neededAmount: string | undefined, contract = USDT) =>
        getExchangeAllowanceCoverage({
            amount,
            neededAmount,
            decimals: 6,
            tokenContractAddress: contract,
        });

    it('has nothing to revoke without an allowance', () => {
        expect(coverage('0', '3.210255')).toEqual({
            kind: 'none',
            coveredRatio: 0,
            neededRatio: 1,
            missingAmount: undefined,
            remainingAmount: undefined,
            requiresReset: false,
        });
    });

    it('is too low when the allowance does not cover the swap', () => {
        expect(coverage('2.408851', '3.210255')).toEqual({
            kind: 'too_low',
            coveredRatio: expect.closeTo(0.7504, 3),
            neededRatio: 1,
            missingAmount: '0.801404',
            remainingAmount: undefined,
            requiresReset: true,
        });
    });

    it('can be raised without a reset for a token that supports it', () => {
        expect(coverage('2.408851', '3.210255', DAI).requiresReset).toBe(false);
    });

    it('covers the swap with the needed amount marked on the allowance', () => {
        expect(coverage('5', '3.210255')).toEqual({
            kind: 'enough',
            coveredRatio: 1,
            neededRatio: expect.closeTo(0.642, 3),
            missingAmount: undefined,
            remainingAmount: '1.789745',
            requiresReset: false,
        });
    });

    it('covers the swap exactly', () => {
        expect(coverage('3.210255', '3.210255')).toMatchObject({
            kind: 'enough',
            neededRatio: 1,
            remainingAmount: '0',
        });
    });

    it('is unlimited above the unlimited threshold', () => {
        // 1e71 token units with 6 decimals is above half of uint256, the unlimited threshold.
        expect(coverage('1'.padEnd(72, '0'), '3')).toEqual({
            kind: 'unlimited',
            coveredRatio: 1,
            neededRatio: 0,
            missingAmount: undefined,
            remainingAmount: undefined,
            requiresReset: false,
        });
    });

    it('treats an allowance without a known swap amount as enough', () => {
        expect(coverage('5', undefined)).toMatchObject({
            kind: 'enough',
            coveredRatio: 1,
            neededRatio: 1,
            remainingAmount: undefined,
        });
    });
});
