import { createAccountStateRead, parseAccountStateResult } from './accountState';

const ADDRESS = '0xB685760EBD368a891F27ae547391F4E2A289895b';
const SLOT_0 = `0x${'0'.repeat(64)}`;
const SLOT_1 = `0x${'0'.repeat(63)}1`;
const CODE_HASH = `0x${'ab'.repeat(32)}`;

const mockResult = (overrides: Record<string, unknown> = {}) => ({
    address: ADDRESS.toLowerCase(),
    balance: '0x0',
    codeHash: CODE_HASH,
    nonce: '0x1',
    storageHash: `0x${'cd'.repeat(32)}`,
    accountProof: [],
    storageProof: [
        { key: SLOT_0, value: '0xa377aa6822603cc52e4e9ed6eaa045c46ef6b3e2', proof: [] },
        { key: SLOT_1, value: '0x0', proof: [] },
    ],
    ...overrides,
});

describe(parseAccountStateResult.name, () => {
    it('reads the code hash and left-pads storage values to full words', () => {
        expect(
            parseAccountStateResult({
                result: mockResult(),
                address: ADDRESS,
                storageKeys: [SLOT_0, SLOT_1],
            }),
        ).toEqual({
            success: true,
            value: {
                address: ADDRESS.toLowerCase(),
                codeHash: CODE_HASH,
                storage: [
                    {
                        key: SLOT_0,
                        value: '0x000000000000000000000000a377aa6822603cc52e4e9ed6eaa045c46ef6b3e2',
                    },
                    { key: SLOT_1, value: `0x${'0'.repeat(64)}` },
                ],
            },
        });
    });

    it.each([
        ['another address', mockResult({ address: `0x${'11'.repeat(20)}` })],
        ['a missing code hash', mockResult({ codeHash: undefined })],
        ['a short code hash', mockResult({ codeHash: '0x1234' })],
        ['fewer storage proofs', mockResult({ storageProof: [{ key: SLOT_0, value: '0x1' }] })],
        [
            'keys in another order',
            mockResult({
                storageProof: [
                    { key: SLOT_1, value: '0x1' },
                    { key: SLOT_0, value: '0x1' },
                ],
            }),
        ],
        [
            'a value wider than a word',
            mockResult({
                storageProof: [
                    { key: SLOT_0, value: `0x1${'0'.repeat(64)}` },
                    { key: SLOT_1, value: '0x1' },
                ],
            }),
        ],
        ['a non-object result', '0x1'],
    ])('refuses %s', (_name, result) => {
        expect(
            parseAccountStateResult({ result, address: ADDRESS, storageKeys: [SLOT_0, SLOT_1] }),
        ).toMatchObject({ success: false, failure: { code: 'VERIFICATION_FAILED' } });
    });
});

describe(createAccountStateRead.name, () => {
    it('asks the prover for exactly the account and slots at "latest"', () => {
        const read = createAccountStateRead({ address: ADDRESS, storageKeys: [SLOT_0] });

        expect(read.method).toBe('eth_getProof');
        expect(JSON.parse(read.argsJson)).toEqual([ADDRESS.toLowerCase(), [SLOT_0], 'latest']);
        expect(read.address).toBe(ADDRESS);
    });
});
