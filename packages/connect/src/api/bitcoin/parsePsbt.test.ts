import type { AccountAddresses, AccountUtxo } from '@trezor/connect-common';

import { parsePsbt } from './parsePsbt';
import { getBitcoinNetworkOrThrow } from '../../data/coinInfo';

// Bitcoin P2PKH PSBT: 1 input (50000), 2 outputs (30000 change + 10000 external).
const P2PKH_PSBT =
    '70736274ff01007701000000016d20f69067ad1ffd50ee7c0f377dde2c932ccb03e84b5659732da99c20f1f6500100000000ffffffff0230750000000000001976a914954820f1de627a703596ac0396f986d958e3de4c88ac10270000000000001976a91405427736705cfbfaff76b1cff48283707fb1037088ac00000000000100e101000000016d20f69067ad1ffd50ee7c0f377dde2c932ccb03e84b5659732da99c20f1f650010000006a47304402203429bd3ce7b38c5c1e8a15340edd79ced41a2939aae62e259d2e3d18e0c5ee7602201b83b10ebc4d6dcee3f9eb42ba8f1ef8a059a05397e0c1b9223d1565a3e6ec01012102a7a079c1ef9916b289c2ff21a992c808d0de3dfcf8a9f163205c5c9e21f55d5cffffffff0230750000000000001976a914954820f1de627a703596ac0396f986d958e3de4c88ac10270000000000001976a91405427736705cfbfaff76b1cff48283707fb1037088ac00000000000000';

// Testnet P2WPKH PSBT: 1 input (7802513), 2 outputs (OP_RETURN "deadbeef" + change).
const TESTNET_PSBT =
    '70736274ff010061010000000179a892cb382adc5eefe98bef7e991ac2062f0f57c1d9c7926fac50b0b14909ae010000000000000000020000000000000000066a04deadbeeffb0d770000000000160014388c56fc4b008bd0efc4a21663f5ebf8a9e4de7800000000000100cf0100000000010179a892cb382adc5eefe98bef7e991ac2062f0f57c1d9c7926fac50b0b14909ae010000000000000000020000000000000000066a04deadbeeffb0d770000000000160014388c56fc4b008bd0efc4a21663f5ebf8a9e4de7802483045022100a87aa2338d0e7401d26b67b76a6446052ef148186893fe4bdceba467b00b5c2c022073159df4b4bb4514d23c8f9b0566098da47da383a829a941b54e95068beba491012102e7477af80286177f60fbf529b8bd3004dd2f0f407ce9f852b3e88fbe295c0f2700000000000000';

const utxo = (
    part: Pick<AccountUtxo, 'txid' | 'vout' | 'amount' | 'path' | 'address'>,
): AccountUtxo => ({
    confirmations: 100,
    blockHeight: 343014,
    ...part,
});

const addresses = (change: { address: string; path: string }[]): AccountAddresses => ({
    used: [],
    unused: [],
    change: change.map(c => ({
        address: c.address,
        path: c.path,
        transfers: 0,
        balance: '0',
        sent: '0',
        received: '0',
    })),
});

describe('api/bitcoin/parsePsbt', () => {
    it('maps a P2PKH PSBT with a change and an external output', () => {
        const result = parsePsbt({
            psbtTransactionData: P2PKH_PSBT,
            coinInfo: getBitcoinNetworkOrThrow('btc'),
            addresses: addresses([
                { address: '1EcL6AyfQTyWKGvXwNSfsWoYnD3whzVFdu', path: "m/44'/0'/0'/1/3" },
            ]),
            utxos: [
                utxo({
                    txid: '50f6f1209ca92d7359564be803cb2c932cde7d370f7cee50fd1fad6790f6206d',
                    vout: 1,
                    amount: '50000',
                    path: "m/44'/0'/0'/0/5",
                    address: '1GA9u9TfCG7SWmKCveBumdA1TZpfom6ZdJ',
                }),
            ],
        });

        expect(result).toMatchObject({
            type: 'final',
            bytes: 226,
            fee: '10000',
            feePerByte: '44.24778761061947',
            totalSpent: '20000',
            outputsPermutation: [0, 1],
            inputs: [{ script_type: 'SPENDADDRESS', prev_index: 1, amount: '50000' }],
            outputs: [
                {
                    script_type: 'PAYTOADDRESS',
                    amount: '30000',
                    address_n: [2147483692, 2147483648, 2147483648, 1, 3],
                },
                {
                    script_type: 'PAYTOADDRESS',
                    amount: '10000',
                    address: '1Up15Msx4sbvUCGm8Xgo2Zp5FQim3wE59',
                },
            ],
        });
    });

    it('maps a P2WPKH PSBT with an OP_RETURN and a change output', () => {
        const result = parsePsbt({
            psbtTransactionData: TESTNET_PSBT,
            coinInfo: getBitcoinNetworkOrThrow('test'),
            addresses: addresses([
                { address: 'tb1q8zx9dlztqz9apm7y5gtx8a0tlz57fhncx343ya', path: "m/84'/1'/0'/1/5" },
            ]),
            utxos: [
                utxo({
                    txid: 'ae0949b1b050ac6f92c7d9c1570f2f06c21a997eef8be9ef5edc2a38cb92a879',
                    vout: 1,
                    amount: '7802513',
                    path: "m/84'/1'/0'/1/4",
                    address: 'tb1qguznsd2hyl69gjx2axd6f5qu9k274qj9waffqy',
                }),
            ],
        });

        expect(result).toMatchObject({
            type: 'final',
            bytes: 125,
            fee: '150',
            feePerByte: '1.2',
            totalSpent: '150',
            outputsPermutation: [0, 1],
            inputs: [{ script_type: 'SPENDWITNESS' }],
            outputs: [
                { script_type: 'PAYTOOPRETURN', amount: '0', op_return_data: 'deadbeef' },
                {
                    script_type: 'PAYTOWITNESS',
                    amount: '7802363',
                    address_n: [2147483732, 2147483649, 2147483648, 1, 5],
                },
            ],
        });
    });

    it('throws when a PSBT input is not found among the account utxos', () => {
        expect(() =>
            parsePsbt({
                psbtTransactionData: P2PKH_PSBT,
                coinInfo: getBitcoinNetworkOrThrow('btc'),
                addresses: addresses([]),
                utxos: [],
            }),
        ).toThrow('parsePsbt: Utxo [0] not found');
    });

    it('throws when outputs exceed inputs (non-positive fee)', () => {
        expect(() =>
            parsePsbt({
                psbtTransactionData: P2PKH_PSBT,
                coinInfo: getBitcoinNetworkOrThrow('btc'),
                addresses: addresses([
                    { address: '1EcL6AyfQTyWKGvXwNSfsWoYnD3whzVFdu', path: "m/44'/0'/0'/1/3" },
                ]),
                utxos: [
                    utxo({
                        txid: '50f6f1209ca92d7359564be803cb2c932cde7d370f7cee50fd1fad6790f6206d',
                        vout: 1,
                        amount: '30000',
                        path: "m/44'/0'/0'/0/5",
                        address: '1GA9u9TfCG7SWmKCveBumdA1TZpfom6ZdJ',
                    }),
                ],
            }),
        ).toThrow('parsePsbt: Transaction fee is non-positive');
    });
});
