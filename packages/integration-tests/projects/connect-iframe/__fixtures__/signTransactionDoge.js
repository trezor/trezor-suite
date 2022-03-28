const { ADDRESS_N, TX_CACHE } = global.TestUtils;

export default {
    method: 'signTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            // Note: this transaction is not valid
            // it uses some inputs from coin exchange to test big amounts calculation
            description: 'Doge: big amounts',
            params: {
                coin: 'Doge',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/3'/0'/1/0"),
                        amount: '11351855244633976',
                        prev_hash:
                            '0a4cb7d5c27455333701f0e53812e4be56a0272ad7f168279acfed7b065ee118',
                        prev_index: 12,
                    },
                ],
                outputs: [
                    {
                        address: 'D9vbBhmwXgRegm5kVAcx8j6H2GDM87D58T',
                        amount: '1351855234633976',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: ADDRESS_N("m/44'/3'/0'/1/0"),
                        amount: '10000000000000000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['0a4cb7']),
            },
            result: {
                signatures: [
                    '30440220630fb136ace260ea0e28039a1e847d52ab4ca826975bb923681d407375e9ccaa022012c060120d56d1908fe89353927e8746238811ce9e6c4593d7874bd2927beb75',
                ],
                serializedTx:
                    '010000000118e15e067bedcf9a2768f1d72a27a056bee41238e5f00137335574c2d5b74c0a0c0000006a4730440220630fb136ace260ea0e28039a1e847d52ab4ca826975bb923681d407375e9ccaa022012c060120d56d1908fe89353927e8746238811ce9e6c4593d7874bd2927beb750121021e49598faaca4bb40db6c73d2aafb93bae864d12b1af9e83c952412f3b02ae4cffffffff02f8500c5381cd04001976a914347b22316f4920eba6b61aa79889c314386f9a6088ac0000c16ff28623001976a914a1e0c04eb8da2d135c3249cf39b69c86494f78b688ac00000000',
            },
        },
    ],
};
