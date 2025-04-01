import { ChainedTransactions } from '@suite-common/wallet-types';

export const chainedTxsFixture: ChainedTransactions = {
    own: [
        {
            descriptor:
                'vpub5Z9LPnVj4bx9zqAjLJvRgnaUrcwXaW1H48VYtizkQeP2vLDxqWTNKqeYujfqquxuUEXdAfwtdVuCKYscvz4EXH9cADxKFHyvdapGXQnhvWf',
            deviceState: 'mk9cuzrhHk5qy4K4u5tu3aiwD6DXo13zuy@8806280C47785970FA58D555:1',
            symbol: 'regtest',
            type: 'sent',
            txid: 'f915b58d18616519eff1da0662c9629dcbddd0165c87227f9a8c4d7b3fa95d83',
            hex: '0200000000010190e45827b595d02923212be77de384a064db08b676d2b1008826cefd310eff050100000000fdffffff02fc63e0d601000000160014ad77e39bb0914ce76de2d9b6922588b0d55aea3400ab904100000000160014936c86635e6ced12c5e83494ceff3d6c1152b7ab02483045022100a1f12a13f043f66e939a2688ce75f634278583b65e1df44ab124d1fe3796d690022064c889927b655c2e600042665f8ddc2f12167c50066792a09237bd2be153d1e0012103fee374cce30b5016a6ed48e841e0a835fd5fe8f25181dd406dac27328c5f471600000000',
            blockTime: 1738322817,
            blockHeight: -1,
            amount: '1100000000',
            fee: '1410',
            vsize: 141,
            feeRate: '10',
            targets: [
                {
                    n: 1,
                    addresses: ['bcrt1qjdkgvc67dnk3930gxj2valeadsg49datkyz7tu'],
                    isAddress: true,
                    amount: '1100000000',
                },
            ],
            tokens: [],
            internalTransfers: [],
            rbf: true,
            details: {
                vin: [
                    {
                        txid: '05ff0e31fdce268800b1d276b608db64a084e37de72b212329d095b52758e490',
                        vout: 1,
                        sequence: 4294967293,
                        n: 0,
                        addresses: ['bcrt1qte33uyyfzrdrm9nqk0uwlq9dqr6ezu2gurhree'],
                        isAddress: true,
                        isOwn: true,
                        value: '8999998590',
                        isAccountOwned: true,
                    },
                ],
                vout: [
                    {
                        value: '7899997180',
                        n: 0,
                        hex: '0014ad77e39bb0914ce76de2d9b6922588b0d55aea34',
                        addresses: ['bcrt1q44m78xasj9xwwm0zmxmfyfvgkr244635x6u5gt'],
                        isAddress: true,
                        isOwn: true,
                        isAccountOwned: true,
                    },
                    {
                        value: '1100000000',
                        n: 1,
                        hex: '0014936c86635e6ced12c5e83494ceff3d6c1152b7ab',
                        addresses: ['bcrt1qjdkgvc67dnk3930gxj2valeadsg49datkyz7tu'],
                        isAddress: true,
                    },
                ],
                size: 223,
                totalInput: '8999998590',
                totalOutput: '8999997180',
            },
            rbfParams: {
                type: 'bitcoin',
                txid: 'f915b58d18616519eff1da0662c9629dcbddd0165c87227f9a8c4d7b3fa95d83',
                utxo: [
                    {
                        amount: '8999998590',
                        txid: '05ff0e31fdce268800b1d276b608db64a084e37de72b212329d095b52758e490',
                        vout: 1,
                        address: 'bcrt1qte33uyyfzrdrm9nqk0uwlq9dqr6ezu2gurhree',
                        path: "m/84'/1'/0'/1/0",
                        blockHeight: 0,
                        confirmations: 0,
                    },
                ],
                outputs: [
                    {
                        type: 'change',
                        address: 'bcrt1q44m78xasj9xwwm0zmxmfyfvgkr244635x6u5gt',
                        amount: '7899997180',
                        formattedAmount: '78.9999718',
                    },
                    {
                        type: 'payment',
                        address: 'bcrt1qjdkgvc67dnk3930gxj2valeadsg49datkyz7tu',
                        amount: '1100000000',
                        formattedAmount: '11',
                    },
                ],
                feeRate: '10',
                baseFee: 1410,
            },
        },
    ],
    others: [],
};
