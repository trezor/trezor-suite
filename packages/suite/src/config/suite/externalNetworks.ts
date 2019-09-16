export default [
    {
        symbol: 'xem',
        name: 'NEM',
        url: 'https://nem.io/downloads/',
    },
    {
        symbol: 'xlm',
        name: 'Stellar',
        url: 'https://trezor.io/stellar',
    },
    {
        symbol: 'ada',
        name: 'Cardano',
        url: 'https://adalite.io/app',
    },
    {
        symbol: 'xtz',
        name: 'Tezos',
        url: 'https://wallet.simplestaking.com/tezos/wallet/start',
    },
] as {
    symbol: string;
    name: string;
    url: string;
    isHidden?: boolean;
}[];
