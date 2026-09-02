import { fixtures } from './__fixtures__/script';
import { templates } from './__fixtures__/templates';
import { OPS } from './ops';
import { decode as pushdataDecode } from './pushdata';

import * as bscript from './index';

// https://github.com/bitcoin/bitcoin/blob/master/src/script/script.h#L22
const MAX_SCRIPT_ELEMENT_SIZE = 520;

// https://github.com/bitcoin/bips/blob/master/bip-0062.mediawiki
function checkMinimalPush(opcode: number, data: Buffer): boolean {
    if (data.length === 0) return opcode === OPS.OP_0;
    if (data.length === 1 && typeof data[0] === 'number' && data[0] >= 1 && data[0] <= 16)
        return opcode === OPS.OP_1 + (data[0] - 1);
    if (data.length === 1 && data[0] === 0x81) return opcode === OPS.OP_1NEGATE;
    if (data.length <= 75) return opcode === data.length;
    if (data.length <= 255) return opcode === OPS.OP_PUSHDATA1;
    if (data.length <= 65535) return opcode === OPS.OP_PUSHDATA2;

    return false;
}

// https://github.com/bitcoin/bips/blob/master/bip-0062.mediawiki
function isBip62(buffer: Buffer): boolean {
    let i = 0;
    while (i < buffer.length) {
        const opcode = buffer[i] as number;
        if (opcode >= 0 && opcode <= OPS.OP_PUSHDATA4) {
            const d = pushdataDecode(buffer, i);
            if (d === null) return false;
            i += d.size;
            if (i + d.number > buffer.length) return false;
            const data = buffer.subarray(i, i + d.number);
            i += d.number;
            if (d.number > MAX_SCRIPT_ELEMENT_SIZE) return false;
            if (!checkMinimalPush(opcode, data)) return false;
        } else {
            i++;
        }
    }

    return true;
}

describe('script', () => {
    // TODO
    describe('isCanonicalPubKey', () => {
        it('rejects if not provided a Buffer', () => {
            // @ts-expect-error
            expect(bscript.isCanonicalPubKey(0)).toBe(false);
        });
        // eslint-disable-next-line jest/no-commented-out-tests
        // it('rejects smaller than 33', () => {
        //     for (let i = 0; i < 33; i++) {
        //         expect(bscript.isCanonicalPubKey(Buffer.from('', i))).toBe(false);
        //     }
        // });
    });
    // eslint-disable-next-line jest/no-commented-out-tests
    // describe.skip('isCanonicalSignature', () => {});

    describe('fromASM/toASM', () => {
        fixtures.valid.forEach(f => {
            it(`encodes/decodes ${f.asm}`, () => {
                const script = bscript.fromASM(f.asm);
                expect(bscript.toASM(script)).toEqual(f.asm);
            });
        });

        fixtures.invalid.fromASM.forEach(f => {
            it(`throws ${f.description}`, () => {
                expect(() => bscript.fromASM(f.script)).toThrow(f.description);
            });
        });
    });

    describe('fromASM/toASM (templates)', () => {
        templates.valid.forEach(f => {
            if (f.inputHex) {
                const ih = bscript.toASM(Buffer.from(f.inputHex, 'hex'));

                it(`encodes/decodes ${ih}`, () => {
                    const script = bscript.fromASM(f.input);
                    expect(script.toString('hex')).toEqual(f.inputHex);
                    expect(bscript.toASM(script)).toEqual(f.input);
                });
            }

            if (f.outputHex) {
                it(`encodes/decodes ${f.output}`, () => {
                    const script = bscript.fromASM(f.output);
                    expect(script.toString('hex')).toEqual(f.outputHex);
                    expect(bscript.toASM(script)).toEqual(f.output);
                });
            }
        });
    });

    describe('isPushOnly', () => {
        fixtures.valid.forEach(f => {
            it(`returns ${!!f.stack} for ${f.asm}`, () => {
                const script = bscript.fromASM(f.asm);
                const chunks = bscript.decompile(script);

                expect(bscript.isPushOnly(chunks)).toEqual(!!f.stack);
            });
        });
    });

    describe('toStack', () => {
        fixtures.valid.forEach(f => {
            it(`returns ${!!f.stack} for ${f.asm}`, () => {
                if (!f.stack || !f.asm) return;

                const script = bscript.fromASM(f.asm);

                const stack = bscript.toStack(script);
                expect(stack.map(x => x.toString('hex'))).toEqual(f.stack);

                expect(bscript.toASM(bscript.compile(stack))).toEqual(f.asm);
            });
        });
    });

    describe('compile (via fromASM)', () => {
        fixtures.valid.forEach(f => {
            it(`compiles ${f.asm}`, () => {
                const scriptSig = bscript.fromASM(f.asm);

                expect(scriptSig.toString('hex')).toEqual(f.script);

                if (f.nonstandard) {
                    const scriptSigNS = bscript.fromASM(f.nonstandard.scriptSig);

                    expect(scriptSigNS.toString('hex')).toEqual(f.script);
                }
            });
        });
    });

    describe('compile (Buffer passthrough)', () => {
        it('returns the same Buffer unchanged when given a Buffer input', () => {
            const buf = Buffer.from('51', 'hex');
            expect(bscript.compile(buf)).toBe(buf);
        });
    });

    describe('toStack (non-push-only rejection)', () => {
        it('throws "Expected push-only script" for a script containing OP_CHECKSIG', () => {
            const script = Buffer.from([bscript.OPS.OP_CHECKSIG]);
            expect(() => bscript.toStack(script)).toThrow('Expected push-only script');
        });
    });

    describe('compile (non-array, non-buffer rejection)', () => {
        it('throws "Expected Array" when called with a non-Buffer non-Array input', () => {
            expect(() => bscript.compile({} as unknown as Buffer)).toThrow('Expected Array');
        });
    });

    describe('decompile (truncated pushdata header)', () => {
        it('returns [] when buffer contains OP_PUSHDATA1 alone (pushdata.decode returns null)', () => {
            const truncated = Buffer.from([bscript.OPS.OP_PUSHDATA1]);
            expect(bscript.decompile(truncated)).toEqual([]);
        });
    });

    describe('decompile', () => {
        fixtures.valid.forEach(f => {
            it(`decompiles ${f.asm}`, () => {
                const chunks = bscript.decompile(Buffer.from(f.script, 'hex'));

                expect(bscript.compile(chunks).toString('hex')).toEqual(f.script);
                expect(bscript.toASM(chunks)).toEqual(f.asm);

                if (f.nonstandard) {
                    const chunksNS = bscript.decompile(
                        Buffer.from(f.nonstandard.scriptSigHex, 'hex'),
                    );

                    expect(bscript.compile(chunksNS).toString('hex')).toEqual(f.script);

                    // toASM converts verbatim, only `compile` transforms the script to a minimalpush compliant script
                    expect(bscript.toASM(chunksNS)).toEqual(f.nonstandard.scriptSig);
                }
            });
        });

        fixtures.invalid.decompile.forEach(f => {
            it(`decompiles ${f.script} to [] because of "${f.description}"`, () => {
                const chunks = bscript.decompile(Buffer.from(f.script, 'hex'));

                expect(chunks.length).toBe(0);
            });
        });
    });

    describe('SCRIPT_VERIFY_MINIMALDATA policy', () => {
        fixtures.valid.forEach(f => {
            it(`compliant for scriptSig ${f.asm}`, () => {
                const script = Buffer.from(f.script, 'hex');

                expect(isBip62(script)).toBe(true);
            });
        });

        function testEncodingForSize(num: number) {
            it(`compliant for data PUSH of length ${num}`, () => {
                const buffer = Buffer.alloc(num);
                const script = bscript.compile([buffer]);

                expect(isBip62(script)).toBe(true);
            });
        }

        for (let i = 0; i < 520; ++i) {
            testEncodingForSize(i);
        }
    });
});
