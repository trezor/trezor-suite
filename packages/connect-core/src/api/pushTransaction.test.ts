import { asCoinSymbol } from '@trezor/connect-common';

import PushTransactionBase from './pushTransaction';
import { setCustomBackend } from '../backend/BlockchainLink';
import { getCoinInfoOrThrow } from '../data/coinInfo';

class PushTransaction extends PushTransactionBase {
    getTransactionData() {
        return this.params.tx;
    }
}

const createMethod = (coin: string, tx: string, disableAlternativeRPC?: boolean) =>
    new PushTransaction({
        payload: { method: 'pushTransaction', coin: asCoinSymbol(coin), tx, disableAlternativeRPC },
    });

beforeAll(() => {
    setCustomBackend(getCoinInfoOrThrow(asCoinSymbol('regtest')), {
        type: 'blockbook',
        url: ['http://localhost:19121'],
    });
});

afterAll(() => {
    setCustomBackend(getCoinInfoOrThrow(asCoinSymbol('regtest')), undefined);
});

describe.each(['btc', 'test', 'regtest', 'ltc', 'doge', 'zec', 'bch'])(
    'pushTransaction %s Bitcoin-family payload',
    coin => {
        it.each(['0123456789abcdefABCDEF', ''])('accepts the original hex string %j', hex => {
            expect(createMethod(coin, hex).getTransactionData()).toEqual({ hex });
        });

        it.each([undefined, true, false])(
            'accepts a transaction object with disableAlternativeRPC=%s',
            disableAlternativeRPC => {
                const hex = '0123456789abcdefABCDEF';

                expect(createMethod(coin, hex, disableAlternativeRPC).getTransactionData()).toEqual(
                    { hex, disableAlternativeRPC },
                );
            },
        );

        it.each(['not-hexadecimal', '0x1234', '12 34'])('rejects invalid hex %j', hex => {
            expect(() => createMethod(coin, hex)).toThrow('Transaction must be hexadecimal');
        });
    },
);

describe.each(['eth', 'xrp', 'xlm', 'ada', 'trx', 'sol'])(
    'pushTransaction %s non-Bitcoin payload',
    coin => {
        it('preserves the existing string and object payloads', () => {
            const hex = 'serialized-transaction';
            const tx = { hex, disableAlternativeRPC: true };

            expect(createMethod(coin, hex).getTransactionData()).toEqual({ hex });
            expect(createMethod(coin, hex, true).getTransactionData()).toEqual(tx);
        });
    },
);
