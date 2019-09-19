import { ExternalNetwork } from '@wallet-types';

export default [
    {
        networkType: 'external',
        symbol: 'xem',
        name: 'NEM',
        url: 'https://nem.io/downloads/',
    },
    {
        networkType: 'external',
        symbol: 'xlm',
        name: 'Stellar',
        url: 'https://trezor.io/stellar',
    },
    {
        networkType: 'external',
        symbol: 'ada',
        name: 'Cardano',
        url: 'https://adalite.io/app',
    },
    {
        networkType: 'external',
        symbol: 'xtz',
        name: 'Tezos',
        url: 'https://wallet.simplestaking.com/tezos/wallet/start',
    },
] as ExternalNetwork[];
