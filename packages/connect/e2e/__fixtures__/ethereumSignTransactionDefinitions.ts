export default {
    method: 'ethereumSignTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            // Uniswap V3 Universal Router — exactInputSingle (WETH → USDT).
            // The router contract triggers an EthereumDefinitionRequest with func_sig
            // so the device can request a display-format definition for the call.
            // We fetch definitions from data.trezor.io and respond with EthereumDefinitionAck.
            description: 'Uniswap V3 exactInputSingle',
            params: {
                path: "m/44'/60'/0'",
                transaction: {
                    nonce: '0x0',
                    gasPrice: '0x14',
                    gasLimit: '0x14',
                    to: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
                    value: '0x0',
                    chainId: 1,
                    data: '0x04e45aaf000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec70000000000000000000000000000000000000000000000000000000000000bb800000000000000000000000051117eb63623aee74a39b63bd9efa3a728800dbb000000000000000000000000000000000000000000000000002386f26fc1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
                },
            },
            result: {},
            deviceScreen: /"body":"UniswapV3Router".*"body":"Swap".*0\.01WETH.*0USDT.*0\.3%/,
            deviceScreenSkip: ['1', '<2.12.1'],
        },
    ],
} satisfies TestCase;
