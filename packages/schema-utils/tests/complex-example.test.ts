import { Type, Validate } from '../src';

describe('complex-example', () => {
    it('should work with a schema like StellarSignTx', () => {
        const schema = Type.Object({
            address_n: Type.Array(Type.Uint()),
            network_passphrase: Type.String(),
            source_account: Type.String(),
            fee: Type.Uint(),
            sequence_number: Type.Uint(),
            timebounds_start: Type.Uint(),
            timebounds_end: Type.Uint(),
            memo_type: Type.String(),
            memo_text: Type.String(),
            memo_id: Type.String(),
            memo_hash: Type.Buffer(),
            num_operations: Type.Uint(),
        });
        expect(schema.type).toEqual('object');

        const value = {
            address_n: [0],
            network_passphrase: 'test',
            source_account: 'GAA2J2KQV6J4LXQK2K3J2LQ3ZK7Q2K3J2K3J2K3J2K3J2K3J2K3J2K3J2',
            fee: 100,
            sequence_number: 4294967296,
            timebounds_start: 0,
            timebounds_end: 4294967296,
            memo_type: 'MEMO_TEXT',
            memo_text: 'test',
            memo_id: '123',
            memo_hash: Buffer.from('test'),
            num_operations: 1,
        };
        expect(Validate(schema, value)).toBe(true);

        const invalidValue = {
            address_n: 'invalid',
            network_passphrase: 'test',
            source_account: 123456789,
            fee: 100,
            sequence_number: 4294967296,
            timebounds_start: 0,
            timebounds_end: 4294967296,
            memo_type: 'MEMO_TEXT',
            memo_text: 'test',
            memo_id: '123',
            memo_hash: Buffer.from('test'),
            num_operations: 1,
        };
        expect(Validate(schema, invalidValue)).toBe(false);
    });

    it('should work with a schema like EthereumSignTypedHash', () => {
        const schema = Type.Object({
            address_n: Type.Array(Type.Uint()),
            domain_separator_hash: Type.String(),
            message_hash: Type.String(),
            encoded_network: Type.ArrayBuffer(),
        });
        expect(schema.type).toEqual('object');

        const value = {
            address_n: [0],
            domain_separator_hash: 'test',
            message_hash: 'test',
            encoded_network: new ArrayBuffer(10),
        };
        expect(Validate(schema, value)).toBe(true);

        const invalidValue = {
            address_n: 'invalid',
            domain_separator_hash: 'test',
            message_hash: 'test',
            encoded_network: 'invalid',
        };
        expect(Validate(schema, invalidValue)).toBe(false);
    });
});
