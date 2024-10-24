import { encode, encodeAck, decode } from '../src/protocol-thp';
import { decode as decodeV2 } from '../src/protocol-v2';

describe('protocol-thp', () => {
    const protobufEncoder = (..._args: any[]) => {
        return {
            messageType: 1,
            payload: Buffer.alloc(1),
        };
    };
    const protobufDecoder = (messageName: string | number, messageData: Buffer) => {
        return {
            messageName: messageName.toString(),
            message: {
                mockRawData: messageData,
            },
        };
    };

    const protocolState: any = {
        tag: Buffer.from('a0a1a2a3a4a5a6a7a8a9b0b1b2b3b4b5', 'hex'),
        channel: Buffer.from('1234', 'hex'),
        sendBit: 0,
        recvBit: 0,
    };

    it('encode/decode ThpCreateChannelRequest', () => {
        const nonce = Buffer.from('eb7c85d5604bf4d7', 'hex');
        const encoded = encode({
            messageType: 'ThpCreateChannelRequest',
            data: { nonce },
            protobufEncoder,
            protocolState,
        });
        expect(encoded.toString('hex')).toEqual('40ffff000ceb7c85d5604bf4d7ad7bc634');

        const decoded = decode(decodeV2(encoded), protobufDecoder);
        expect(decoded.messageName).toEqual('ThpCreateChannelRequest');
        expect(decoded.payload).toEqual(nonce);
    });

    it('decode ThpCreateChannelResponse', () => {
        const devicePropertiesProtobuf = Buffer.from('0a045433573110051800200128012802', 'hex');
        const payload = Buffer.concat([
            Buffer.from('eb7c85d5604bf4d7', 'hex'), // nonce
            Buffer.from('1234', 'hex'), // new channel
            devicePropertiesProtobuf,
        ]);
        // const result = encode({
        //     messageType: 'ThpCreateChannelResponse',
        //     data: {
        //         nonce: Buffer.from('eb7c85d5604bf4d7', 'hex'),
        //         new_channel: Buffer.from('1234', 'hex'),
        //         properties: devicePropertiesProtobuf,
        //     },
        //     protobufEncoder: () => ({
        //         messageType: 1000,
        //         payload: devicePropertiesProtobuf,
        //     }),
        //     protocolState,
        // });
        // expect(result.toString('hex')).toEqual(
        //     '41ffff001eeb7c85d5604bf4d712340a045433573110051800200128012802783fd287',
        //     //'41ffff001e1d323007d4bd64ee12340a04543357311005180020012801280270cc0db40000000000000000000000000000000000000000000000000000000000'
        // );

        const decoded = decode(
            decodeV2(
                Buffer.from(
                    '41ffff001eeb7c85d5604bf4d712340a045433573110051800200128012802783fd287',
                    'hex',
                ),
            ),
            protobufDecoder,
        );
        expect(decoded.messageName).toEqual('ThpCreateChannelResponse');
        expect(decoded.payload).toEqual(Buffer.concat([payload, Buffer.from('783fd287', 'hex')])); // payload + crc
        expect(decoded.message).toMatchObject({
            nonce: Buffer.from('eb7c85d5604bf4d7', 'hex'),
            channel: Buffer.from('1234', 'hex'),
        });
        if (!decoded.message || !('properties' in decoded.message)) {
            throw new Error('Missing properties');
        }
        expect(decoded.message.properties.mockRawData).toEqual(devicePropertiesProtobuf);
    });

    it('encode/decode ThpReadAck', () => {
        const encodeAsBytes1 = encodeAck(Buffer.from('201234', 'hex'));
        expect(encodeAsBytes1.toString('hex')).toEqual('2012340004d9fcce58');
        const encodeAsBytes2 = encodeAck(Buffer.from('281234', 'hex'));
        expect(encodeAsBytes2.toString('hex')).toEqual('2812340004e98c8599');

        const encodeAsState1 = encodeAck(protocolState);
        expect(encodeAsState1.toString('hex')).toEqual('2012340004d9fcce58');
        const encodeAsState2 = encodeAck({ ...protocolState, recvBit: 1 });
        expect(encodeAsState2.toString('hex')).toEqual('2812340004e98c8599');

        expect(decode(decodeV2(encodeAsBytes1), protobufDecoder).messageName).toBe('ThpReadAck');
        expect(decode(decodeV2(encodeAsBytes2), protobufDecoder).messageName).toBe('ThpReadAck');
        expect(decode(decodeV2(encodeAsState1), protobufDecoder).messageName).toBe('ThpReadAck');
        expect(decode(decodeV2(encodeAsState2), protobufDecoder).messageName).toBe('ThpReadAck');
    });

    it('encode/decode ThpHandshakeInitRequest', () => {
        const key = Buffer.alloc(16).fill(7);
        const encoded = encode({
            messageType: 'ThpHandshakeInitRequest',
            data: { key },
            protobufEncoder,
            protocolState,
        });
        expect(encoded.toString('hex')).toEqual(
            '001234002407070707070707070707070707070707a0a1a2a3a4a5a6a7a8a9b0b1b2b3b4b5d47b551c',
        );

        const decoded = decode(decodeV2(encoded), protobufDecoder);
        expect(decoded.messageName).toEqual('ThpHandshakeInitRequest');
        // key + protocolState.tag + crc
        expect(decoded.payload.toString('hex')).toEqual(
            '07070707070707070707070707070707a0a1a2a3a4a5a6a7a8a9b0b1b2b3b4b5d47b551c',
        );
        expect(decoded.message).toEqual({
            key,
            tag: protocolState.tag,
        });
    });

    it.only('encode/decode ThpHandshakeCompletionRequest', () => {
        const key = Buffer.alloc(16).fill(7);
        const encoded = encode({
            messageType: 'ThpHandshakeCompletionRequest',
            data: { hostPubkey: key, noise: key },
            protobufEncoder: () => ({
                messageType: 0,
                payload: Buffer.from('29292929', 'hex'),
            }),
            protocolState: { ...protocolState, sendBit: 1 },
        });
        expect(encoded.toString('hex')).toEqual(
            '12123400280707070707070707070707070707070729292929a0a1a2a3a4a5a6a7a8a9b0b1b2b3b4b552155930',
        );

        const decoded = decode(decodeV2(encoded), protobufDecoder);
        expect(decoded.messageName).toEqual('ThpHandshakeCompletionRequest');
        // // key + protocolState.tag + crc
        // expect(decoded.payload.toString('hex')).toEqual(
        //     '07070707070707070707070707070707a0a1a2a3a4a5a6a7a8a9b0b1b2b3b4b5d47b551c',
        // );
        expect(decoded.message).toEqual({
            key,
            // tag: protocolState.tag,
        });
    });

    // it('encode/decode ThpHandshakeCompletionRequest', () => {
    //     const chunks = encode(Buffer.alloc(8), {
    //         messageType: 'ThpHandshakeCompletionRequest',
    //     });

    //     expect(chunks[0].toString('hex')).toEqual(
    //         '121234004800112233445566770011223344556677001122334455667700112233445566770011223344556677001122334455667710011003a0a1a2a3a4a5a6',
    //     );
    //     expect(chunks[1].toString('hex')).toEqual('801234a7a8a9b0b1b2b3b4b5a3bff1f9');

    //     // 12123400490011223344556677001122334455667700112233445566770011223344556677001122334455667700112233445566770a01011002A0A1A2A3A4A5A6A7A8A9B0B1B2B3B4B545448ea6

    //     const decoded = decode(chunks[0]);
    //     expect(decoded.messageType).toEqual('ThpHandshakeCompletionRequest');
    // });

    // it('encode/decode ThpHandshakeCompletionResponse', () => {
    //     const payload = Buffer.concat([
    //         Buffer.from('01', 'hex'), // state ok
    //         Buffer.from('00010203040506070809101112131415', 'hex'), // tag
    //     ]);
    //     const chunk = encode(payload, {
    //         messageType: 'ThpHandshakeCompletionResponse',
    //     });

    //     expect(chunk.toString('hex')).toEqual(
    //         '131234001501000102030405060708091011121314152ff709cf',
    //     );
    //     const decoded = decode(chunk);
    //     expect(decoded.messageType).toEqual('ThpHandshakeCompletionResponse');
    //     expect(decoded.payload).toEqual(payload);

    //     const enco2 = encode(decoded.payload, {
    //         messageType: decoded.messageType,
    //     });
    //     expect(enco2.toString('hex')).toEqual(
    //         '131234001501000102030405060708091011121314152ff709cf',
    //     );
    // });

    // it('encode/decode GetFeatures', () => {
    //     const chunks = encode(Buffer.alloc(0), {
    //         messageType: 55,
    //     });

    //     expect(chunks.toString('hex')).toEqual(
    //         '1412340017010037a0a1a2a3a4a5a6a7a8a9b0b1b2b3b4b5d63303d4',
    //     );
    //     // expect(chunks[1].toString('hex')).toEqual('801234a7a8a9b0b1b2b3b4b5a3bff1f9');

    //     const decoded = decode(chunks);
    //     expect(decoded.messageType).toEqual(55);
    //     // expect(decoded.sessionId).toEqual(1);
    // });

    // it('encode/decode ThpNewSession', () => {
    //     // const chunks = encode(Buffer.from('0801', 'hex'), {
    //     //     messageType: 1001,
    //     // });

    //     // console.log('hunks', chunks[0].toString('hex'));

    //     // expect(chunks[0].toString('hex')).toEqual(
    //     //     '1412340017010037a0a1a2a3a4a5a6a7a8a9b0b1b2b3b4b5d63303d4',
    //     // );
    //     // expect(chunks[1].toString('hex')).toEqual('801234a7a8a9b0b1b2b3b4b5a3bff1f9');

    //     const decoded = decode(
    //         Buffer.from(
    //             '04123800230003e80a0870617373313233341000a0a1a2a3a4a5a6a7a8a9b0b1b2b3b4b504db712b',
    //             'hex',
    //         ),
    //         // Buffer.from(
    //         //     '14123500230003e80a0870617373313233341000a0a1a2a3a4a5a6a7a8a9b0b1b2b3b4b5ac728968',
    //         //     'hex',
    //         // ),
    //         // Buffer.from('04123500190003e90801a0a1a2a3a4a5a6a7a8a9b0b1b2b3b4b50e39c0c6', 'hex'),

    //         // Buffer.from('04123500190003e90801a0a1a2a3a4a5a6a7a8a9b0b1b2b3b4b50e39c0c6', 'hex'),
    //     );
    //     expect(decoded.messageType).toEqual('TrezorHostProtocolMessage');
    //     // expect(decoded.magic).toEqual(4);
    //     // expect(decoded.channel.toString('hex')).toEqual('1238');
    //     expect(decoded.header.toString('hex')).toEqual('041238');
    //     expect(decoded.length).toEqual(35);
    //     // expect(decoded.crc).toEqual('041238');
    //     expect(decoded.payload.toString('hex')).toEqual(
    //         '0003e80a0870617373313233341000a0a1a2a3a4a5a6a7a8a9b0b1b2b3b4b504db712b',
    //     );

    //     // const encoded = encode(decoded.payload, {
    //     //     messageType: 'TrezorHostProtocolMessage',
    //     // });
    //     const encoded = encode(decoded.payload, decoded);
    //     console.log('Encoded?', encoded);

    //     expect(encoded.toString('hex')).toEqual(
    //         '04123800230003e80a0870617373313233341000a0a1a2a3a4a5a6a7a8a9b0b1b2b3b4b504db712b',
    //     );
    // });

    // it('decode ThpCreateChannel', () => {
    //     // const read = decode(Buffer.from('40ffff000c001122334455667796643c6c', 'hex'));
    //     const read = decode(
    //         Buffer.from(
    //             '40ffff001e001122334455667712630a04543357311005180020012801280209a8bca9',
    //             'hex',
    //         ),
    //     );
    //     console.log('Read', read);
    //     expect(read.messageType).toEqual('ThpDeviceProperties');
    //     expect(read.length).toEqual(16);
    // });

    // it('decode encrypted message', () => {
    //     // const read = decode(Buffer.from('40ffff000c001122334455667796643c6c', 'hex'));
    //     const read = decode(
    //         // Buffer.from(
    //         //     '1212340015010001020304050607080910111213141538df6d0f0000000000000000000000000000000000000000000000000000000000000000000000000000',
    //         //     'hex',
    //         // ),
    //         Buffer.from(
    //             '02123400160212a0a1a2a3a4a5a6a7a8a9b0b1b2b3b4b5a3d1795000000000000000000000000000000000000000000000000000000000000000000000000000',
    //             'hex',
    //         ),
    //         // Buffer.from(
    //         //     '02123400160212a0a1a2a3a4a5a6a7a8a9b0b1b2b3b4b5a3d1795000000000000000000000000000000000000000000000000000000000000000000000000000',
    //         //     'hex',      39 |     console.log('buildBuffer2', messageType);

    //         // ),
    //         { messageType: 'ThpProtobufMessage' },
    //     );
    //     console.log('Read', read);
    //     // expect(read.messageType).toEqual('ThpDeviceProperties');
    //     // expect(read.length).toEqual(16);
    // });

    // it('encode encrypted message', () => {
    //     const result = encode(Buffer.from('00', 'hex'), {
    //         messageType: 'ThpCreateNewSession',
    //     });
    //     console.log('Result', result);
    // });
});
