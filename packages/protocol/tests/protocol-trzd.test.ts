import { trzd } from '../src/index';

describe('protocol-v1', () => {
    it('decode', () => {
        // Testnet chain
        let data = Buffer.from(
            '74727a643100585a6865130008011203455448183c2208457468657265756dDEAD',
            'hex',
        );
        let read;

        read = trzd.decode(data);
        expect(read.magic).toEqual('trzd1');
        expect(read.definitionType).toEqual(0);
        expect(read.protobufLength).toEqual(19);
        expect(read.protobufPayload.toBuffer().toString('hex')).toEqual(
            '08011203455448183c2208457468657265756d',
        );

        // Testnet token
        data = Buffer.from(
            '74727a643101585a686532000a147af963cf6d228e564e2a0aa0ddbf06210b38615d10051a0354535420122a11676f65726c69205465737420746f6b656eDEAD',
            'hex',
        );
        read = trzd.decode(data);
        expect(read.magic).toEqual('trzd1');
        expect(read.definitionType).toEqual(1);
        expect(read.protobufLength).toEqual(50);
        expect(read.protobufPayload.toBuffer().toString('hex')).toEqual(
            '0a147af963cf6d228e564e2a0aa0ddbf06210b38615d10051a0354535420122a11676f65726c69205465737420746f6b656e',
        );

        // chain name > 256
        const longName = Buffer.from('LongName'.repeat(50)); // 400 bytes
        const len = Buffer.alloc(2);
        len.writeInt16LE(longName.length);
        data = Buffer.from(
            `74727a643100585a6865${len.toString('hex')}${longName.toString('hex')}DEAD`,
            'hex',
        );
        console.warn(len.toString('hex'));
        read = trzd.decode(data);
        expect(read.protobufLength).toEqual(400);
        expect(read.protobufPayload.toBuffer()).toEqual(longName);
    });
});
