import {
    ThpState,
    decode,
    decodeSendAck,
    encode,
    encodeAck,
    getExpectedResponses,
    isAckExpected,
    isExpectedResponse,
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
            // properties asserted below
            // TODO: add-crypto
            // handshakeHash
        });

        // @ts-expect-error
        const protobuf = decoded.message.properties.mockProtobufData.toString('hex');
        expect(protobuf).toEqual('0a0454335731180220002802280328042801');
    });

    it('encode/decode ThpAck', () => {
        thpState.setChannel(Buffer.from('1234', 'hex'));

        const encodeAsBytes1 = encodeAck(Buffer.from('201234', 'hex')); // ackByte: 0
        expect(encodeAsBytes1.toString('hex')).toEqual('2012340004d9fcce58');
        const encodeAsBytes2 = encodeAck(Buffer.from('281234', 'hex')); // ackByte: 1
        expect(encodeAsBytes2.toString('hex')).toEqual('2812340004e98c8599');

        const encodeAsState1 = encodeAck(thpState); // ackByte: 0
        expect(encodeAsState1.toString('hex')).toEqual('2012340004d9fcce58');

        thpState.updateSyncBit('recv');
        const encodeAsState2 = encodeAck(thpState); // ackByte: 1
        expect(encodeAsState2.toString('hex')).toEqual('2812340004e98c8599');

        expect(decode(decodeV2(encodeAsBytes1), protobufDecoder, thpState).type).toBe('ThpAck');
        expect(decode(decodeV2(encodeAsBytes2), protobufDecoder, thpState).type).toBe('ThpAck');
        expect(decode(decodeV2(encodeAsState1), protobufDecoder, thpState).type).toBe('ThpAck');
        expect(decode(decodeV2(encodeAsState2), protobufDecoder, thpState).type).toBe('ThpAck');
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

    it('decodeSendAck', () => {
        const thpError2 = decodeSendAck(decodeV2(Buffer.from('42122200050270303cfa', 'hex')));
        expect(thpError2.type).toBe('ThpError');

        const ack = decodeSendAck(decodeV2(Buffer.from('2812340004e98c8599', 'hex')));
        expect(ack.type).toBe('ThpAck');

        expect(() => decodeSendAck(decodeV2(Buffer.from('40ffff0004f9215951', 'hex')))).toThrow(
            'Unexpected send response',
        );

        expect(() => decodeSendAck(decodeV2(Buffer.from('40ffff000499999999', 'hex')))).toThrow(
            'Invalid CRC',
        );
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

    it('isExpectedResponse', () => {
        thpState.setChannel(Buffer.from('1234', 'hex'));
        thpState.setExpectedResponses([0x20]); // expect ThpAck

        const consoleSpy = jest.fn();
        jest.spyOn(console, 'warn').mockImplementation(consoleSpy);

        expect(isExpectedResponse(Buffer.from('2012340004d9fcce58', 'hex'), thpState)).toBe(true); // ThpAck
        expect(isExpectedResponse(Buffer.from('42123400050270303cfa', 'hex'), thpState)).toBe(true); // ThpError
        expect(isExpectedResponse(Buffer.from('4012340000', 'hex'), thpState)).toBe(false); // something else
        expect(isExpectedResponse(Buffer.from('4043210000', 'hex'), thpState)).toBe(false); // something else on different channel
        expect(isExpectedResponse(Buffer.from('20', 'hex'), thpState)).toBe(false); // message to short
        expect(isExpectedResponse(Buffer.from('2812340004e98c8599', 'hex'), thpState)).toBe(false); // ThpAck with unexpected control bit
        expect(consoleSpy).toHaveBeenCalledTimes(1); // check unexpected control bit warning

        thpState.setExpectedResponses([0x04, 0x80]); // expect encrypted message and continuation packet
        thpState.setChannel(Buffer.from('485a', 'hex'));
        expect(isExpectedResponse(Buffer.from('04485a0000', 'hex'), thpState)).toBe(true);
        expect(isExpectedResponse(Buffer.from('80485a0000', 'hex'), thpState)).toBe(true);
        expect(isExpectedResponse(Buffer.from('14485a0000', 'hex'), thpState)).toBe(false); // decrypted with unexpected control bit
        expect(consoleSpy).toHaveBeenCalledTimes(2); // check unexpected control bit warning
    });
});
