import type { CoinSymbol } from '@trezor/connect-common';

type CoinSelectOption = {
    value: CoinSymbol;
    label: string;
    affectedValue: string;
};

export const coinsSelect: CoinSelectOption[] = [
    { value: 'btc', label: 'Bitcoin', affectedValue: `m/49'/0'/0'` },
    { value: 'test', label: 'Bitcoin Testnet', affectedValue: `m/49'/1'/0'` },
    { value: 'bch', label: 'Bitcoin Cash', affectedValue: `m/44'/145'/0'` },
    { value: 'btg', label: 'Bitcoin Gold', affectedValue: `m/49'/156'/0'` },
    { value: 'ltc', label: 'Litecoin', affectedValue: `m/49'/2'/0'` },
    { value: 'dash', label: 'Dash', affectedValue: `m/44'/5'/0'` },
    { value: 'zec', label: 'Zcash', affectedValue: `m/44'/133'/0'` },
    { value: 'doge', label: 'Dogecoin', affectedValue: `m/44'/3'/0'` },
];

export const allCoinsSelect = [
    ...coinsSelect,
    { value: 'eth', label: 'Ethereum', affectedValue: `m/44'/60'/0'` },
    { value: 'xrp', label: 'Ripple', affectedValue: `m/44'/144'/0'` },
    { value: 'xlm', label: 'Stellar', affectedValue: `m/44'/148'/0'` },
    { value: 'ada', label: 'Cardano', affectedValue: `m/1852'/1815'/0'` },
    { value: 'sol', label: 'Solana', affectedValue: `m/44'/501'/0'` },
    { value: 'xtz', label: 'Tezos', affectedValue: `m/44'/1729'/0'` },
    { value: 'trx', label: 'Tron', affectedValue: `m/44'/195'/0'` },
    { value: 'xmr', label: 'Monero', affectedValue: `m/44'/128'/0'` },
];
