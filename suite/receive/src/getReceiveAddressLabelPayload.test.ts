import { type Account } from '@suite-common/wallet-types';

import { getReceiveAddressLabelPayload } from './getReceiveAddressLabelPayload';

const getAccount = (symbol: string): Account =>
    ({
        key: 'descriptor-symbol-device',
        symbol,
        path: "m/44'/60'/0'/0/0",
        descriptor: 'accountDescriptor',
    }) as unknown as Account;

const address = 'freshAddress';

describe('getReceiveAddressLabelPayload', () => {
    (['eth', 'pol', 'sol', 'xrp', 'trx'] as const).forEach(symbol => {
        it(`returns account label payload for address based network ${symbol}`, () => {
            expect(getReceiveAddressLabelPayload(getAccount(symbol), address)).toEqual({
                type: 'accountLabel',
                entityKey: 'descriptor-symbol-device',
                defaultValue: "m/44'/60'/0'/0/0",
            });
        });
    });

    (['btc', 'ada'] as const).forEach(symbol => {
        it(`returns address label payload for utxo based network ${symbol}`, () => {
            expect(getReceiveAddressLabelPayload(getAccount(symbol), address)).toEqual({
                type: 'addressLabel',
                entityKey: 'descriptor-symbol-device',
                defaultValue: address,
                networkSymbol: symbol,
                accountDescriptor: 'accountDescriptor',
            });
        });
    });
});
