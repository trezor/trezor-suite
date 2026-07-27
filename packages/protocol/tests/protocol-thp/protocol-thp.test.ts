import {
    ThpState,
    decode,
    encode,
    encodeAck,
    encodePreviousAck,
    getExpectedResponses,
    isAckExpected,
} from '../../src/protocol-thp';
import { decode as decodeV2 } from '../../src/protocol-v2';

const protobufEncoder = (..._args: any[]) => ({
    messageType: 1,
    message: Buffer.alloc(1),
});

const protobufDecoder = (messageName: string | number, messageData: Buffer) => ({
    type: messageName.toString(),
    message: {
        mockProtobufData: messageData,
    },
});

const thpState = new ThpState();

describe('protocol-thp', () => {
    beforeEach(() => {
        thpState.resetState();
    });

    it('encode ThpCreateChannelRequest, decode ThpCreateChannelResponse', () => {
        thpState.setChannel(Buffer.from('ffff', 'hex'));
        const nonce = Buffer.from('639ba57ff4e0c234', 'hex');

        const encoded = encode({
            messageName: 'ThpCreateChannelRequest',
            data: { nonce },
            protobufEncoder,
            thpState,
        });
        expect(encoded.toString('hex')).toEqual('40ffff000c639ba57ff4e0c2348189a406');

        const response = Buffer.from(
            '41ffff0020639ba57ff4e0c2343c830a0454335731180220002802280328042801c0171551',
            'hex',
        );
        const decoded = decode(decodeV2(response), protobufDecoder, thpState);
        expect(decoded.type).toEqual('ThpCreateChannelResponse');

        expect(decoded.message).toMatchObject({
            channel: Buffer.from('3c83', 'hex'),
            nonce,
            handshakeHash: Buffer.from(
                'a1615c6dc1c2a2df8155ea5b54d0f39c320d4908e4b1eaf8d24ab5c4b466e947',
                'hex',
            ),
            // properties asserted below
        });

        // @ts-expect-error
        const protobuf = decoded.message.properties.mockProtobufData.toString('hex');
        expect(protobuf).toEqual('0a0454335731180220002802280328042801');
    });

    it('encode/decode ThpAck', () => {
        thpState.setChannel(Buffer.from('1234', 'hex'));

        const thpAck0 = '2012340004d9fcce58'; // ackByte: 0
        const thpAck1 = '2812340004e98c8599'; // ackByte: 1

        const encodeAck0 = encodeAck(thpState);
        expect(encodeAck0.toString('hex')).toEqual(thpAck0);
        expect(encodePreviousAck(thpState).toString('hex')).toEqual(thpAck1);

        thpState.sync('recv', 'Cancel'); // update state, set ackByte to 1
        const encodeAck1 = encodeAck(thpState);
        expect(encodeAck1.toString('hex')).toEqual(thpAck1);
        expect(encodePreviousAck(thpState).toString('hex')).toEqual(thpAck0);

        expect(decode(decodeV2(encodeAck0), protobufDecoder, thpState).type).toBe('ThpAck');
        expect(decode(decodeV2(encodeAck1), protobufDecoder, thpState).type).toBe('ThpAck');
    });

    it('decode ThpError', () => {
        thpState.setChannel(Buffer.from('1222', 'hex'));

        const data = Buffer.from('42122200050270303cfa', 'hex');
        const thpError = decode(decodeV2(data), protobufDecoder, thpState);
        expect(thpError.type).toBe('ThpError');
        expect(thpError.message).toMatchObject({
            code: 'ThpUnallocatedChannel',
        });
    });

    it('ThpState serialize/deserialize', () => {
        const state1 = new ThpState();
        state1.setChannel(Buffer.from('4321', 'hex'));
        state1.updateSyncBit('send');
        state1.updateNonce('recv');
        state1.setExpectedResponses([1, 2, 3, 4]);

        const serializedState = state1.serialize();

        const state2 = new ThpState();
        state2.deserialize(serializedState);

        expect(state1.channel).toEqual(state2.channel);
        expect(state1.sendBit).toEqual(state2.sendBit);
        expect(state1.recvNonce).toEqual(state2.recvNonce);
        expect(state1.expectedResponses).toEqual(state2.expectedResponses);

        expect(state1.toString()).toMatch('{"channel":"4321"');

        const s = serializedState;
        const e = 'invalid state';
        // @ts-expect-error
        expect(() => state2.deserialize(null)).toThrow(e);
        // @ts-expect-error
        expect(() => state2.deserialize({})).toThrow(e);
        // @ts-expect-error
        expect(() => state2.deserialize({ ...s, expectedResponses: [null] })).toThrow(e);
        // @ts-expect-error
        expect(() => state2.deserialize({ ...s, sendBit: null })).toThrow(e);
        // @ts-expect-error
        expect(() => state2.deserialize({ ...s, recvBit: null })).toThrow(e);
        // @ts-expect-error
        expect(() => state2.deserialize({ ...s, channel: 11 })).toThrow(e);
    });

    it('ThpState update sync bit & nonce', () => {
        const state = new ThpState();
        state.updateSyncBit('send'); // set initial to 1

        // rotate few times
        for (let i = 0; i < 7; i++) {
            // send process completed
            state.updateSyncBit('send');
            state.updateNonce('send');
            // receive process completed
            state.updateSyncBit('recv');
            state.updateNonce('recv');
        }

        expect(state.serialize()).toMatchObject({
            sendBit: 0,
            recvBit: 1,
            sendNonce: 7,
            recvNonce: 8,
        });
    });

    it('isAckExpected', () => {
        thpState.setChannel(Buffer.from('1234', 'hex'));

        // ThpCreateChannelRequest => ThpAck not expected
        let msg = Buffer.from('40ffff000ceb7c85d5604bf4d7ad7bc634', 'hex');
        expect(isAckExpected(msg)).toBe(false);

        // ThpHandshakeInitRequest => ThpAck expected
        msg = Buffer.from(
            '001234002407070707070707070707070707070707a0a1a2a3a4a5a6a7a8a9b0b1b2b3b4b5d47b551c',
            'hex',
        );
        expect(isAckExpected(msg)).toBe(true);
    });

    it('getExpectedResponses', () => {
        thpState.setChannel(Buffer.from('1234', 'hex'));

        // ThpCreateChannelRequest
        expect(
            getExpectedResponses(Buffer.from('40ffff000ceb7c85d5604bf4d7ad7bc634', 'hex')),
        ).toEqual([65]); // ThpCreateChannelResponse should start with 41ffff...

        // unknown thp message type 33...
        expect(getExpectedResponses(Buffer.from('33123400000', 'hex'))).toEqual([]);
    });
});
