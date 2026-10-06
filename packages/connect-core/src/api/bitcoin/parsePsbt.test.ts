import type { AccountAddresses, AccountUtxo } from '@trezor/connect-common';

import { parsePsbt } from './parsePsbt';
import { getBitcoinNetworkOrThrow } from '../../data/coinInfo';

// Testnet P2WPKH PSBT: 1 input (7802513), 2 outputs (OP_RETURN "deadbeef" + change).
// Same PSBT as the "Testnet (Bech32/P2WPKH)" case in e2e/__fixtures__/composePsbt.ts.
const TESTNET_PSBT =
    '70736274ff010061010000000179a892cb382adc5eefe98bef7e991ac2062f0f57c1d9c7926fac50b0b14909ae010000000000000000020000000000000000066a04deadbeeffb0d770000000000160014388c56fc4b008bd0efc4a21663f5ebf8a9e4de7800000000000100cf0100000000010179a892cb382adc5eefe98bef7e991ac2062f0f57c1d9c7926fac50b0b14909ae010000000000000000020000000000000000066a04deadbeeffb0d770000000000160014388c56fc4b008bd0efc4a21663f5ebf8a9e4de7802483045022100a87aa2338d0e7401d26b67b76a6446052ef148186893fe4bdceba467b00b5c2c022073159df4b4bb4514d23c8f9b0566098da47da383a829a941b54e95068beba491012102e7477af80286177f60fbf529b8bd3004dd2f0f407ce9f852b3e88fbe295c0f2700000000000000';

const addresses: AccountAddresses = {
    used: [],
    unused: [],
    change: [
        {
            address: 'tb1q8zx9dlztqz9apm7y5gtx8a0tlz57fhncx343ya',
            path: "m/84'/1'/0'/1/5",
            transfers: 0,
            balance: '0',
            sent: '0',
            received: '0',
        },
    ],
};

const utxos: AccountUtxo[] = [
    {
        txid: 'ae0949b1b050ac6f92c7d9c1570f2f06c21a997eef8be9ef5edc2a38cb92a879',
        vout: 1,
        amount: '7802513',
        blockHeight: 343014,
        confirmations: 100,
        path: "m/84'/1'/0'/1/4",
        address: 'tb1qguznsd2hyl69gjx2axd6f5qu9k274qj9waffqy',
    },
];

const parse = (psbtTransactionData: string) =>
    parsePsbt({
        psbtTransactionData,
        coinInfo: getBitcoinNetworkOrThrow('test'),
        addresses,
        utxos,
    });

const catchError = (fn: () => unknown) => {
    try {
        fn();
    } catch (e) {
        return e;
    }
    throw new Error('Expected parsePsbt to throw');
};

describe('api/bitcoin/parsePsbt', () => {
    it('maps a valid testnet PSBT', () => {
        expect(parse(TESTNET_PSBT)).toMatchObject({
            type: 'final',
            bytes: 125,
            fee: '150',
            totalSpent: '150',
        });
    });

    // Psbt.fromHex throws plain Errors for malformed data; parsePsbt must
    // rethrow them as Method_InvalidParameter like its other validation errors.
    it.each([
        ['invalid magic bytes', '00000000ff' + TESTNET_PSBT.slice(10), 'Invalid PSBT magic bytes.'],
        ['truncated data', TESTNET_PSBT.slice(0, 60), 'Cannot read slice out of bounds'],
        ['trailing data', TESTNET_PSBT + 'aa', 'PSBT has unexpected data.'],
    ])('throws Method_InvalidParameter on %s', (_description, psbtData, parserMessage) => {
        const error = catchError(() => parse(psbtData));

        expect(error).toMatchObject({
            code: 'Method_InvalidParameter',
            message: `parsePsbt: Invalid PSBT data: ${parserMessage}`,
        });
    });
});
