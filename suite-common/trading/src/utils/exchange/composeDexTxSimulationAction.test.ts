import { type ExchangeTrade } from 'invity-api';

import { type Account } from '@suite-common/wallet-types';

import { composeDexTxSimulationAction } from './composeDexTxSimulationAction';
import { accountEth } from '../../__fixtures__/utils';

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
