export const coinsSelectBitcoin = [
    { value: 'btc', label: 'Bitcoin', affectedValue: `m/49'/0'/0'` },
    { value: 'test', label: 'Bitcoin Testnet', affectedValue: `m/49'/1'/0'` },
    { value: 'bch', label: 'Bitcoin Cash', affectedValue: `m/44'/145'/0'` },
    { value: 'btg', label: 'Bitcoin Gold', affectedValue: `m/49'/156'/0'` },
    { value: 'ltc', label: 'Litecoin', affectedValue: `m/49'/2'/0'` },
    { value: 'dash', label: 'Dash', affectedValue: `m/44'/5'/0'` },
    { value: 'zcash', label: 'Zcash', affectedValue: `m/44'/133'/0'` },
    { value: 'doge', label: 'Dogecoin', affectedValue: `m/44'/3'/0'` },
];

export const coinsSelectOther = [
    { value: 'eth', label: 'Ethereum', affectedValue: `m/44'/60'/0'/0` },
    { value: 'tSEP', label: 'Ethereum Testnet Sepolia', affectedValue: `m/44'/1'/0'/0` },
    { value: 'tHOL', label: 'Ethereum Testnet Holesky', affectedValue: `m/44'/1'/0'/0` },
    { value: 'etc', label: 'Ethereum Classic', affectedValue: `m/44'/60'/0'/0` },
    { value: 'sol', label: 'Solana', affectedValue: `m/44'/501'/0'/0'` },
    { value: 'dsol', label: 'Solana Devnet', affectedValue: `m/44'/501'/0'/0'` },
    { value: 'ada', label: 'Cardano', affectedValue: `m/1852'/1815'/0'/0/0` },
    { value: 'tada', label: 'Cardano Testnet', affectedValue: `m/1852'/1815'/0'/0/0` },
    { value: 'xrp', label: 'Ripple', affectedValue: `m/44'/144'/0'/0/0` },
    { value: 'txrp', label: 'Ripple Testnet', affectedValue: `m/44'/144'/0'/0/0` },
];

export const coinsSelect = [
    ...coinsSelectBitcoin.map(c => ({ ...c, bitcoinLike: true })),
    ...coinsSelectOther.map(c => ({ ...c, bitcoinLike: false })),
];
