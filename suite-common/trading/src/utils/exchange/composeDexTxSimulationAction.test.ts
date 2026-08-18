import { type ExchangeTrade } from 'invity-api';

import { type Account } from '@suite-common/wallet-types';

import { composeDexTxSimulationAction } from './composeDexTxSimulationAction';
import { accountEth, accountSol } from '../../__fixtures__/utils';

const sourceOrigin = 'trezor-suite://trading-dex-swap';

const dexQuote = {
    isDex: true,
    dexTx: {
        from: '0x0000000000000000000000000000000000001234',
        to: '0x000000000000000000000000000000000000abcd',
        value: '1',
        data: '0xdeadbeef',
    },
} as ExchangeTrade;

const solanaAccount = accountSol as Account;
const stellarAccount = {
    ...accountSol,
    networkType: 'stellar',
    symbol: 'xlm',
} as Account;

const compose = (quote: ExchangeTrade | undefined, account: Account | undefined) =>
    composeDexTxSimulationAction({ quote, account, sourceOrigin });

describe('composeDexTxSimulationAction', () => {
    it('returns null for a non-DEX quote', () => {
        expect(compose({ ...dexQuote, isDex: false }, accountEth as Account)).toBeNull();
    });

    it('returns null without an account', () => {
        expect(compose(dexQuote, undefined)).toBeNull();
    });

    it('composes an ethereumSignTransaction action for an EVM swap', () => {
        expect(compose(dexQuote, accountEth as Account)).toMatchObject({
            method: 'ethereumSignTransaction',
            fromAddress: dexQuote.dexTx?.from,
            sourceOrigin,
            payload: { transaction: { to: dexQuote.dexTx?.to, chainId: 1 } },
        });
    });

    it('composes a solanaSignTransaction action with the base64 dexTx re-encoded as hex', () => {
        const serializedTx = '0102ab';
        const quote = {
            ...dexQuote,
            dexTx: {
                ...dexQuote.dexTx!,
                data: Buffer.from(serializedTx, 'hex').toString('base64'),
            },
        } as ExchangeTrade;

        expect(compose(quote, solanaAccount)).toEqual({
            method: 'solanaSignTransaction',
            symbol: 'sol',
            fromAddress: solanaAccount.descriptor,
            sourceOrigin,
            payload: { path: solanaAccount.path, serializedTx },
        });
    });

    it('returns null for a Solana quote without transaction data', () => {
        expect(compose({ ...dexQuote, dexTx: undefined }, solanaAccount)).toBeNull();
    });

    it('composes a stellarSignTransaction action with the dexTx as the XDR envelope', () => {
        const xdrBase64 = 'AAAAAgAAAAA=';
        const quote = {
            ...dexQuote,
            dexTx: { ...dexQuote.dexTx!, data: xdrBase64 },
        } as ExchangeTrade;

        expect(compose(quote, stellarAccount)).toEqual({
            method: 'stellarSignTransaction',
            symbol: 'xlm',
            fromAddress: stellarAccount.descriptor,
            sourceOrigin,
            payload: { path: stellarAccount.path, xdrBase64, testnet: false },
        });
    });

    it('marks the testnet flag for a txlm account', () => {
        const quote = {
            ...dexQuote,
            dexTx: { ...dexQuote.dexTx!, data: 'AAAAAgAAAAA=' },
        } as ExchangeTrade;
        const account = { ...stellarAccount, symbol: 'txlm' } as Account;

        expect(compose(quote, account)).toMatchObject({
            symbol: 'txlm',
            payload: { testnet: true },
        });
    });

    it('returns null for a Stellar quote without transaction data', () => {
        expect(compose({ ...dexQuote, dexTx: undefined }, stellarAccount)).toBeNull();
    });

    it.each(['etc', 'thod'] as const)('returns null for %s, which Blockaid cannot scan', symbol => {
        expect(compose(dexQuote, { ...accountEth, symbol } as Account)).toBeNull();
    });

    it('returns null for a network without simulation support', () => {
        expect(
            compose(dexQuote, {
                ...accountEth,
                networkType: 'bitcoin',
                symbol: 'btc',
            } as Account),
        ).toBeNull();
    });
});
