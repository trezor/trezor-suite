import { parseCoinsJson, getCoinInfo, getUniqueNetworks } from '../src';

// todo: maybe remove this in favor of real coins.json ?
const coinsJSON = {
    bitcoin: [
        {
            address_type: 0,
            address_type_p2sh: 5,
            bech32_prefix: 'bc',
            blockchain_link: {
                type: 'blockbook',
                url: [
                    'https://btc1.trezor.io',
                    'https://btc2.trezor.io',
                    'https://btc3.trezor.io',
                    'https://btc4.trezor.io',
                    'https://btc5.trezor.io',
                ],
            },
            blocktime_seconds: 600,
            cashaddr_prefix: null,
            coin_label: 'Bitcoin',
            coin_name: 'Bitcoin',
            coin_shortcut: 'BTC',
            consensus_branch_id: null,
            curve_name: 'secp256k1',
            decimals: 8,
            decred: false,
            default_fee_b: {
                Economy: 70,
                High: 200,
                Low: 10,
                Normal: 140,
            },
            dust_limit: 546,
            extra_data: false,
            force_bip143: false,
            fork_id: null,
            hash_genesis_block: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
            max_address_length: 34,
            maxfee_kb: 2000000,
            min_address_length: 27,
            minfee_kb: 1000,
            name: 'Bitcoin',
            segwit: true,
            shortcut: 'BTC',
            signed_message_header: 'Bitcoin Signed Message:\n',
            slip44: 0,
            support: {
                connect: true,
                suite: true,
                trezor1: '1.5.2',
                trezor2: '2.0.5',
            },
            timestamp: false,
            taproot: true,
            xprv_magic: 76066276,
            xpub_magic: 76067358,
            xpub_magic_multisig_segwit_native: 44728019,
            xpub_magic_multisig_segwit_p2sh: 43365439,
            xpub_magic_segwit_native: 78792518,
            xpub_magic_segwit_p2sh: 77429938,
        },
        {
            address_type: 48,
            address_type_p2sh: 50,
            bech32_prefix: 'ltc',
            blockchain_link: {
                type: 'blockbook',
                url: [
                    'https://ltc1.trezor.io',
                    'https://ltc2.trezor.io',
                    'https://ltc3.trezor.io',
                    'https://ltc4.trezor.io',
                    'https://ltc5.trezor.io',
                ],
            },
            blocktime_seconds: 150,
            cashaddr_prefix: null,
            coin_label: 'Litecoin',
            coin_name: 'Litecoin',
            coin_shortcut: 'LTC',
            consensus_branch_id: null,
            curve_name: 'secp256k1',
            decimals: 8,
            decred: false,
            default_fee_b: {
                Normal: 1000,
            },
            dust_limit: 546,
            extra_data: false,
            force_bip143: false,
            fork_id: null,
            hash_genesis_block: '12a765e31ffd4059bada1e25190f6e98c99d9714d334efa41a195a7e7e04bfe2',
            max_address_length: 34,
            maxfee_kb: 67000000,
            min_address_length: 27,
            minfee_kb: 1000,
            name: 'Litecoin',
            segwit: true,
            shortcut: 'LTC',
            signed_message_header: 'Litecoin Signed Message:\n',
            slip44: 2,
            support: {
                connect: true,
                suite: true,
                trezor1: '1.5.2',
                trezor2: '2.0.5',
            },
            timestamp: false,
            xprv_magic: 27106558,
            xpub_magic: 27108450,
            xpub_magic_multisig_segwit_native: 27108450,
            xpub_magic_multisig_segwit_p2sh: 27108450,
            xpub_magic_segwit_native: 78792518,
            xpub_magic_segwit_p2sh: 28471030,
        },
    ],
    misc: [
        {
            blockchain_link: {
                type: 'blockfrost',
                url: ['wss://trezor-cardano-mainnet.blockfrost.io'],
            },
            curve: 'ed25519',
            decimals: 6,
            name: 'Cardano',
            shortcut: 'ADA',
            slip44: 1,
            support: {
                connect: true,
                suite: false,
                trezor1: false,
                trezor2: '2.0.8',
            },
        },
    ],
};

describe('data/CoinInfo', () => {
    beforeAll(() => {
        parseCoinsJson(coinsJSON);
    });

    it('getUniqueNetworks', () => {
        const inputs = [
            getCoinInfo('btc'),
            getCoinInfo('ltc'),
            getCoinInfo('btc'),
            getCoinInfo('ltc'),
            getCoinInfo('ltc'),
        ];
        const result = [getCoinInfo('btc'), getCoinInfo('ltc')];
        // @ts-ignore
        expect(getUniqueNetworks(inputs)).toEqual(result);
    });
});
