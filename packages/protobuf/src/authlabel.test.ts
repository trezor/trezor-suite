import type { AnyDesc } from '@bufbuild/protobuf';

import { ProtobufManager } from './manager';
import * as authLabelProto from './definitions/messages-authlabel_pb';
import * as messagesProto from './definitions/messages_pb';
import * as optionsProto from './definitions/options_pb';

// Verifies the buf-generated AuthLabel wire descriptor round-trips through the
// ProtobufManager (encode -> decode) — i.e. Suite speaks the exact wire format
// the firmware verified in the device tests.
//
// NOTE: the numeric MessageType mapping (AuthLabelGetState -> 2214 ...) lives in
// `messages_pb` (the shared MessageType registry), which is normally regenerated
// wholesale by `yarn workspace @trezor/protobuf update:protobuf <firmware-branch>`.
// For this PoC the 6 entries were appended surgically by
// `.context/poc-labeling/patch_messages_pb.mjs` (a full regen from the older local
// firmware clone would drop newer upstream entries). Replace that with a real
// regen once the protos land on a firmware branch current with main.
const manager = ProtobufManager();
manager.load([authLabelProto, messagesProto, optionsProto] as unknown as Record<string, AnyDesc>[]);

describe('authlabel wire encode/decode', () => {
    it('maps the message names to their MessageType wire numbers', () => {
        expect(manager.findSchema('AuthLabelGetState').messageType).toBe(2214);
        expect(manager.findSchema('AuthLabelState').messageType).toBe(2215);
        expect(manager.findSchema('AuthLabelShow').messageType).toBe(2216);
        expect(manager.findSchema('AuthLabelShowAck').messageType).toBe(2217);
        expect(manager.findSchema('AuthLabelChange').messageType).toBe(2218);
        expect(manager.findSchema('AuthLabelChangeAck').messageType).toBe(2219);
        // decoding by numeric id resolves back to the right message
        expect(manager.findSchema(2215).messageName).toBe('AuthLabelState');
    });

    it('round-trips AuthLabelState', () => {
        const payload = {
            counter: 7,
            empty_root_mac: 'aa'.repeat(32),
            wallet_id: 'bb'.repeat(20),
        };
        const { message } = manager.encode('AuthLabelState', payload);
        const decoded = manager.decode('AuthLabelState', message);
        expect(decoded.type).toBe('AuthLabelState');
        expect(decoded.message).toMatchObject(payload);
    });

    it('round-trips AuthLabelChangeAck', () => {
        const payload = {
            new_root: '12'.repeat(32),
            new_counter: 42,
            new_mac: '34'.repeat(32),
        };
        const { message } = manager.encode('AuthLabelChangeAck', payload);
        const decoded = manager.decode('AuthLabelChangeAck', message);
        expect(decoded.message).toMatchObject(payload);
    });

    it('round-trips AuthLabelShow with a nested trie proof', () => {
        const payload = {
            key_type: 5,
            key_bytes: '6162636465', // "abcde"
            proof: {
                leaf: {
                    key_hash: '11'.repeat(32),
                    label_type: 1,
                    label_value: '416c696365', // "Alice"
                    counter: 3,
                },
                path: [{ prefix: '80', prefix_bits: 2, sibling_hash: '22'.repeat(32) }],
            },
            mac: 'cc'.repeat(32),
        };
        const { message } = manager.encode('AuthLabelShow', payload);
        const decoded = manager.decode('AuthLabelShow', message) as {
            type: string;
            message: Record<string, any>;
        };
        expect(decoded.type).toBe('AuthLabelShow');
        // the manager decodes enum fields to their proto name (bufbuild convention)
        expect(decoded.message.key_type).toBe('AUTH_LABEL_KEY_ADDRESS');
        expect(decoded.message.key_bytes).toBe('6162636465');
        expect(decoded.message.mac).toBe('cc'.repeat(32));
        expect(decoded.message.proof.leaf.label_value).toBe('416c696365');
        expect(decoded.message.proof.leaf.counter).toBe(3);
        expect(decoded.message.proof.path[0].prefix_bits).toBe(2);
        expect(decoded.message.proof.path[0].sibling_hash).toBe('22'.repeat(32));
    });
});
