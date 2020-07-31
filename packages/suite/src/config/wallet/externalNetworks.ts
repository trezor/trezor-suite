import { ArrayElement } from '@suite/types/utils';

const networks = [
    {
        networkType: 'external',
        symbol: 'xem',
        name: 'NEM',
        url: 'https://nemplatform.com/wallets/',
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
] as const;

type ExternalNetwork = { isHidden?: boolean } & ArrayElement<typeof networks>;

export default [...networks] as ExternalNetwork[];
