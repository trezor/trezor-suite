// Temporary, it'll come from the API in the future,
// but for now to be able to validate Yield.xyz data we need it hardcoded
export const EVM_VAULT_ADDRESSES: Record<string, `0x${string}`> = {
    'ethereum-usdc-steakusdc-0xbeef01735c132ada46aa9aa4c54623caa92a64cb-4626-vault':
        '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB',
    'ethereum-usdt-steakusdt-0xbeef047a543e45807105e51a8bbefcc5950fcfba-4626-vault':
        '0xbEef047a543E45807105E51A8BBEFCc5950fcfBa',
    'arbitrum-usdc-steakusdc-0x250cf7c82bac7cb6cf899b6052979d4b5ba1f9ca-4626-vault':
        '0x250CF7c82bAc7cB6cf899b6052979d4B5BA1f9ca',
    'base-usdc-steakusdc-0xbeefe94c8ad530842bfe7d8b397938ffc1cb83b2-4626-vault':
        '0xBEEFE94c8aD530842bfE7d8B397938fFc1cb83b2',
    'ethereum-usdc-wgtusdc-0x8fee7605f78195379a977426ee5e0bab1eac2aec-third-party-oav':
        '0x8fee7605f78195379a977426ee5E0BAb1eAc2aeC',
};
