import { BlockchainLink } from '@trezor/blockchain-link';
import type { PushTransaction } from '@trezor/connect-common';

import { Blockchain } from './Blockchain';
import { getCoinInfoOrThrow } from '../data/coinInfo';

// Signed transactions and their ids, in the form the push is called with.
const signedTransactions: {
    coin: string;
    tx: PushTransaction['tx'];
    txid: string;
    otherTxid: string;
}[] = [
    {
        coin: 'btc',
        tx: '0100000001f1fefefefefefefefefefefefefefefefefefefefefefefefefefefefefefefe000000006b4830450221008732a460737d956fd94d49a31890b2908f7ed7025a9c1d0f25e43290f1841716022004fa7d608a291d44ebbbebbadaac18f943031e7de39ef3bf9920998c43e60c0401210279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ffffffff01a0860100000000001976a914c42e7ef92fdb603af844d064faad95db9bcdfd3d88ac00000000',
        txid: 'a0ff943d3f644d8832b1fa74be4d0ad2577615dc28a7ef74ff8c271b603a082a',
        otherTxid: 'fcdd6d89c43e76dcff94285d9b6e31d5c60cb5e397a76ebc4920befad30907bc',
    },
    {
        coin: 'eth',
        tx: {
            hex: '0xf86c098504a817c800825208943535353535353535353535353535353535353535880de0b6b3a76400008025a028ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276a067cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83',
            disableAlternativeRPC: true,
        },
        txid: '0x33469b22e9f636356c4160a87eb19df52b7412e8eac32a4a55ffe88ea8350788',
        otherTxid: '0x0000000000000000000000000000000000000000000000000000000000000001',
    },
    {
        coin: 'xrp',
        tx: '12000022800000002400000019614000000005f5e1006840000000000186a0732102131facd1eab748d6cddc492f54b04e8c35658894f4add2232ebc5afe7521dbe474473045022100e243ef623675eeeb95965c35c3e06d63a9fc68bb37e17dc87af9c0af83ec057e02206ca8aa5eaab8396397aef6d38d25710441faf7c79d292ee1d627df15ad9346c081148fb40e1ffa5d557ce9851a535af94965e0dd098883147148ebebf7304ccdf1676fefcf9734cf1e780826',
        txid: '6B329E9E0E8B2D73C55FB5B7655AFF9BB23DD316A590A3570BDDA680B1029075',
        otherTxid: '0000000000000000000000000000000000000000000000000000000000000001',
    },
    {
        coin: 'zec',
        tx: '050000800a27a726b4d0d6c200000000eec51900039d2930ca9eb368cb7ebd6b89266ec6f5b75d42458bac66d5878bc19ea073af6b5e0000006b48304502210081ee275d9dc37ad245a3f76eebb005a2e35e69077e6eb2245bf948558871bbc80220474d32efc3d5510953952447d8ecd42e64c946f245d6a044de3182860ce5de7b0121030165aa2d2874f5a7f3c03c9da89c54df5c5d95f2ae70c4a23f693fae0aed326fffffffff172c5ad595f8f05eb30a95e0521908deda5479612afcc30e32e74b02c43afb07b50000006a473044022037cfc85b6be72e5a49a3e8e48317a3f943708835902bfc9c8e940bebd02cd5f9022019a73ea16397240b0d7b3c6381ba7c07796c7beb5d0a21ce482a8790a43af0980121032145fe947eb7743f1ba06b4ec56d399ba13b4d0ca0b31c954645002533b96c34ffffffff172c5ad595f8f05eb30a95e0521908deda5479612afcc30e32e74b02c43afb071c0000006a4730440220662021210062a8e8769a4f167e4b13a836368797f2cd3d3575b7a14759fd5f12022067c0aeb8d8f02d1dcbed5a77b3d1bb79b4725aa2d66a9737ce7b81c2f1f77138012103e2d22122b2b55a34c3de05fb10e3080c06987b6926ad94f502aa9f7c76a5e18cffffffff02e0fc2b01000000001976a914b266783b60b230af4014b28c521179bd151322a088ac2327cb09000000001976a91452c8909040222e956beca8bcb76a8de671e1d42888ac000000',
        txid: '9fcbc749de99e181efc99de0686cd5f4afa9b2c6aade09d0032390cb59c831de',
        otherTxid: 'de31c859cb902303d009deaac6b2a9aff4d56c68e09dc9ef81e199de49c7cb9f',
    },
];

const pushTransaction = (coin: string, tx: PushTransaction['tx'], backendTxid: string) => {
    jest.spyOn(BlockchainLink.prototype, 'pushTransaction').mockResolvedValue(backendTxid);
    const blockchain = new Blockchain({
        coinInfo: getCoinInfoOrThrow(coin),
        postMessage: jest.fn(),
    });

    return blockchain.pushTransaction(tx);
};

describe('backend/Blockchain pushTransaction', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it.each(signedTransactions)(
        'returns the id of the pushed $coin transaction',
        ({ coin, tx, txid }) => expect(pushTransaction(coin, tx, txid)).resolves.toBe(txid),
    );

    it.each(signedTransactions)(
        'rejects the id of another transaction in a $coin backend answer',
        ({ coin, tx, otherTxid }) =>
            expect(pushTransaction(coin, tx, otherTxid)).rejects.toMatchObject({
                code: 'Backend_Error',
            }),
    );

    it('returns the id of a pushed Groestlcoin transaction, which is hashed with single SHA-256', () => {
        const hex =
            '01000000012432db60ab0344a7e067132c7f6dfd55531e849098ce2812aec2508c734ac77d000000006b48304502210096a287593b1212a188e778596eb8ecd4cc169b93a4d115226460d8e3deae431c02206c78ec09b3df977f04a6df5eb53181165c4ea5a0b35f826551349130f879d6b8012102cf5126ff54e38a80a919579d7091cafe24840eab1d30fe2b4d59bdd9d267cad8feffffff0160340300000000001976a914172b4e06e9b7881a48d2ee8062b495d0b2517fe888ac61f92000';
        const txid = 'cb74c8478c5814742c87cffdb4a21231869888f8042fb07a90e015a9db1f9d4a';

        return expect(pushTransaction('grs', hex, txid)).resolves.toBe(txid);
    });
});
