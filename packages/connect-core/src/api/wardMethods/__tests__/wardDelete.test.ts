import { protobufManager } from '@trezor/protobuf';

import * as commonProto from '../../../../../protobuf/src/definitions/messages-common_pb';
import * as wardProto from '../../../../../protobuf/src/definitions/messages-ward_pb';
import * as messagesProto from '../../../../../protobuf/src/definitions/messages_pb';
import * as optionsProto from '../../../../../protobuf/src/definitions/options_pb';

// A DELETE that empties the tree makes the device return new_root = null and mac = null.
// The build-side spread guards only suppress `undefined`, so a decoded `null` used to be
// forwarded to the encoder, which throws:
//   "The first argument must be of type string ... Received null"
// That is what turned a successful on-device delete into a failed round.
beforeAll(() => {
    protobufManager.load([wardProto, commonProto, messagesProto, optionsProto]);
});

describe('WARDConfirmedByWM: a null mac must never reach the encoder', () => {
    const SIG = 'ab'.repeat(64);

    it('THROWS when a decoded null is forwarded (the bug)', () => {
        expect(() =>
            protobufManager.encode('WARDConfirmedByWM', {
                counter: 2,
                mac: null,
                wm_signature: SIG,
            }),
        ).toThrow();
    });

    it('encodes cleanly when absent is normalized to undefined/omitted (the fix)', () => {
        const { message } = protobufManager.encode('WARDConfirmedByWM', {
            counter: 2,
            wm_signature: SIG,
        });
        const decoded = protobufManager.decode('WARDConfirmedByWM', message) as any;

        expect(decoded.message.counter).toBe(2);
        expect(decoded.message.mac).toBeNull(); // absent on the wire
    });

    it('the `!= null` guard suppresses null where `!== undefined` did not', () => {
        const mac: string | null = null;
        const bad = { counter: 2, ...(mac !== undefined && { mac }), wm_signature: SIG };
        const good = { counter: 2, ...(mac != null && { mac }), wm_signature: SIG };

        expect('mac' in bad).toBe(true); // null leaked through
        expect('mac' in good).toBe(false); // suppressed
    });
});

// After a delete empties the tree the host's checkpoint is { root: '', mac: absent }.
// Firmware infers "attested empty tree" from the ABSENT mac and then requires the root
// to be absent too. But '' is not absent on the wire: an empty `bytes` field arrives as
// b"", so `root is not None` and reconcile rejects the whole round with
//   "attested tree is empty but a root was supplied"
// which is what made every operation AFTER a delete fail.
describe('WARDReconcile: the empty root must be omitted, not sent empty', () => {
    beforeAll(() => {
        protobufManager.load([wardProto, commonProto, messagesProto, optionsProto]);
    });

    it("root: '' is PRESENT on the wire (why the naive guard broke)", () => {
        const { message } = protobufManager.encode('WARDReconcile', { root: '' });
        const decoded = protobufManager.decode('WARDReconcile', message) as any;

        // present-but-empty: firmware sees b"", i.e. `root is not None`
        expect(decoded.message.root).toBe('');
        expect(message.length).toBeGreaterThan(0);
    });

    it('omitting root entirely is what "absent" means', () => {
        const { message } = protobufManager.encode('WARDReconcile', {});
        const decoded = protobufManager.decode('WARDReconcile', message) as any;

        expect(decoded.message.root).toBeNull();
        expect(message.length).toBe(0);
    });

    it("the guard must treat '' as absent, so the pair stays consistent", () => {
        const dbRoot = '';
        // the old guard: '' !== undefined -> sent
        expect('root' in { ...(dbRoot !== undefined && { root: dbRoot }) }).toBe(true);
        // the fix: '' counts as absent -> omitted, matching the absent mac
        expect('root' in { ...(dbRoot != null && dbRoot !== '' && { root: dbRoot }) }).toBe(false);
    });
});
