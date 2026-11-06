import { protobufManager } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import { WardCacheEntrySchema } from '../../../../../connect-common/src/types/api/ward/wardCacheEntry';
import * as commonProto from '../../../../../protobuf/src/definitions/messages-common_pb';
import * as wardProto from '../../../../../protobuf/src/definitions/messages-ward_pb';
import * as messagesProto from '../../../../../protobuf/src/definitions/messages_pb';
import * as optionsProto from '../../../../../protobuf/src/definitions/options_pb';

beforeAll(() => {
    protobufManager.load([wardProto, commonProto, messagesProto, optionsProto]);
});

describe('wardCacheEntry', () => {
    const ENTRY_KEY = 'ab'.repeat(32);

    it('accepts a 32-byte hex entry key and nothing else', () => {
        expect(() => Assert(WardCacheEntrySchema, { entryKey: ENTRY_KEY })).not.toThrow();
        expect(() => Assert(WardCacheEntrySchema, { entryKey: 'ab' })).toThrow();
        expect(() => Assert(WardCacheEntrySchema, { entryKey: 'zz'.repeat(32) })).toThrow();
    });

    it('round-trips the request and its counts-only answer on the wire', () => {
        const request = protobufManager.encode('WARDCacheEntry', {
            entry_key: ENTRY_KEY,
            sticky: true,
        });
        expect((protobufManager.decode('WARDCacheEntry', request.message) as any).message).toEqual({
            entry_key: ENTRY_KEY,
            sticky: true,
        });

        const ack = protobufManager.encode('WARDCacheEntryAck', { replaced: true, counter: 7 });
        expect((protobufManager.decode('WARDCacheEntryAck', ack.message) as any).message).toEqual({
            replaced: true,
            counter: 7,
        });
    });
});
