import * as Messages from '../src/messages';
import * as MessagesSchema from '../src/messages-schema';

// Checks deep equality of two types
type EQ<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

describe('schema types are equivalent to protobuf', () => {
    it('MessageType type is equivalent', () => {
        type CheckEq = EQ<Messages.MessageType, MessagesSchema.MessageType>;
        const checkEq: CheckEq = true;
        expect(checkEq).toBe(true);
    });
});
