import { ProtobufManager } from '@trezor/protobuf';
import * as commonProto from '@trezor/protobuf/src/definitions/messages-common_pb';
import * as wardProto from '@trezor/protobuf/src/definitions/messages-ward_pb';
import * as messagesProto from '@trezor/protobuf/src/definitions/messages_pb';
import type { RelayMessage } from '@trezor/ward';

import type { ServiceTransport } from './serviceTransport';

const MAX_MESSAGE = 65536;

export class ServiceCodec {
    private readonly protobuf = ProtobufManager();

    constructor(private readonly transport: ServiceTransport) {
        this.protobuf.load([commonProto, wardProto, messagesProto]);
    }

    async read(timeout = 35000): Promise<RelayMessage> {
        const first = await this.transport.read(timeout);
        if (first.length !== 64 || first.subarray(0, 3).toString('hex') !== '3f2323') {
            throw new Error('WARD service invalid message header');
        }
        const kind = first.readUInt16BE(3);
        const length = first.readUInt32BE(5);
        if (length > MAX_MESSAGE) throw new Error('WARD service message too large');
        const payload = Buffer.alloc(length);
        let copied = first.copy(payload, 0, 9, 9 + Math.min(length, 55));
        while (copied < length) {
            let report: Buffer;
            try {
                report = await this.transport.read(500);
            } catch {
                // An idle poll may time out, but losing a continuation invalidates framing.
                throw new Error('WARD service incomplete message');
            }
            if (report.length !== 64 || report[0] !== 0x3f) {
                throw new Error('WARD service invalid continuation');
            }
            copied += report.copy(payload, copied, 1, 1 + Math.min(length - copied, 63));
        }
        const result = this.protobuf.decode(kind, payload);

        return { name: result.type, message: result.message };
    }

    async write(message: RelayMessage): Promise<void> {
        const encoded = this.protobuf.encode(message.name, message.message);
        if (encoded.message.length > MAX_MESSAGE) throw new Error('WARD service message too large');
        const report = Buffer.alloc(64);
        report.write('?##');
        report.writeUInt16BE(encoded.messageType, 3);
        report.writeUInt32BE(encoded.message.length, 5);
        let offset = 9;
        let sent = 0;
        do {
            const count = encoded.message.copy(report, offset, sent, sent + 64 - offset);
            sent += count;
            report.fill(0, offset + count);
            await this.transport.write(report);
            report[0] = 0x3f;
            offset = 1;
        } while (sent < encoded.message.length);
    }
}
