import { tronAddressToBytes, tronAddressToHex, tronTxIdFromRawData } from './index';

describe('tron/tronAddressToBytes', () => {
    it('decodes a valid mainnet address', () => {
        const bytes = tronAddressToBytes('TKWJhMU8NAviZ9TN5hroaFQPZ83FNctzz4');
        expect(bytes).not.toBeNull();
        expect(bytes!.length).toBe(21);
        expect(bytes![0]).toBe(0x41);
    });

    it('returns null for an address with a corrupted checksum', () => {
        expect(tronAddressToBytes('TKWJhMU8NAviZ9TN5hroaFQPZ83FNctzz5')).toBeNull();
    });

    it('returns null for a clearly invalid string', () => {
        expect(tronAddressToBytes('notanaddress')).toBeNull();
    });
});

describe('tron/tronAddressToHex', () => {
    it('converts a valid address to lowercase hex', () => {
        expect(tronAddressToHex('TKWJhMU8NAviZ9TN5hroaFQPZ83FNctzz4')).toBe(
            '41689ac7d52363bedfae8d478f8fa80becc6d00b59',
        );
    });

    it('returns null for an invalid address', () => {
        expect(tronAddressToHex('TKWJhMU8NAviZ9TN5hroaFQPZ83FNctzz5')).toBeNull();
    });
});

describe('tron/tronTxIdFromRawData', () => {
    it.each([
        {
            contractType: 'TransferContract',
            rawDataHex:
                '0a022240220892f3f1d1e7dbbfd340a0f2a4bbf3335a68080112640a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412330a1541689ac7d52363bedfae8d478f8fa80becc6d00b59121541ab4b3e153ad3596b570c93b74bd9c09edb0c57c418c096b10270a095c9b9f333',
            txid: '3ff8533c7deab6be237ec5bdfec7d68358ac8be2b912f5f845d5aa36e197b05d',
        },
        {
            contractType: 'TriggerSmartContract',
            rawDataHex:
                '0a02e5cf2208e95d58e5462bccdc40fec7d9e0f4335aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a1541689ac7d52363bedfae8d478f8fa80becc6d00b59121541b4a428ab7092c2f1395f376ce297033b3bb446c12244a9059cbb000000000000000000000000187332b64495519e86ee3123f7492bfa321867970000000000000000000000000000000000000000000000017a73ce6f6011f10270feeafddef4339001ec9aab01',
            txid: '423400837a5ce3c039ae1b2ce65c9cb1f971e96dc6ae97a2f10bb47bbba83761',
        },
        {
            contractType: 'FreezeBalanceV2Contract',
            rawDataHex:
                '0a02d5b02208776a740b412fd10b40bae6e5daf4335a59083612550a34747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e467265657a6542616c616e63655632436f6e7472616374121d0a1541689ac7d52363bedfae8d478f8fa80becc6d00b5910c0843d180170ba898ad9f433',
            txid: 'dbc08e42b52267b750be3c865c02db96f470cf1c176824a03676ef787500b70a',
        },
        {
            contractType: 'VoteWitnessContract',
            rawDataHex:
                '0a02d5cd2208605fc06b4cf02746408c85ebdaf4335a6b080412670a30747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e566f74655769746e657373436f6e747261637412330a1541689ac7d52363bedfae8d478f8fa80becc6d00b59121a0a15414e4e68d51df137837ffda057af5efc587e01aac010de02708ca88fd9f433',
            txid: '4f8746a92de74b5fadd2db0bda8d6db0628c54f8796c5b5c45ca62a6cafa4382',
        },
    ])(
        'derives the txid of a real mainnet $contractType from its raw data',
        ({ rawDataHex, txid }) => {
            expect(tronTxIdFromRawData(rawDataHex)).toBe(txid);
        },
    );
});
