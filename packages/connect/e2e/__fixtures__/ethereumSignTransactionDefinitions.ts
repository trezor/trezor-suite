const ethereumSignTransactionDefinitions: TestCase = {
    method: 'ethereumSignTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            // Lido wstETH — wrap(uint256) (0.999999999999999998 stETH → wstETH).
            // The wstETH contract triggers an EthereumDefinitionRequest with func_sig
            // so the device can request a display-format definition for the call.
            // We fetch definitions from data.trezor.io and respond with EthereumDefinitionAck.
            // Calldata taken from the clear-signing ERC-7730 registry "Wrap stETH" vector.
            description: 'Lido wstETH wrap',
            params: {
                path: "m/44'/60'/0'",
                transaction: {
                    nonce: '0x0',
                    gasPrice: '0x14',
                    gasLimit: '0x14',
                    to: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
                    value: '0x0',
                    chainId: 1,
                    data: '0xea598cb00000000000000000000000000000000000000000000000000de0b6b3a763fffe',
                },
            },
            result: {},
            deviceScreen: /"body":"LidoDAO".*"body":"WrapstETH".*0\.999999999999999998STETH/,
            deviceScreenSkip: ['1', '<2.12.1'],
        },
    ],
};

export default ethereumSignTransactionDefinitions;
