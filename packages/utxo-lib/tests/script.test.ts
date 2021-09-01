import * as bscript from '../src/script';

import { fixtures } from './__fixtures__/script';
import { templates } from './__fixtures__/templates';

import * as minimalData from 'minimaldata';

describe('script', () => {
    // TODO
    describe('isCanonicalPubKey', () => {
        it('rejects if not provided a Buffer', () => {
            // @ts-expect-error
            expect(bscript.isCanonicalPubKey(0)).toBe(false);
        });
        // it('rejects smaller than 33', () => {
        //     for (let i = 0; i < 33; i++) {
        //         expect(bscript.isCanonicalPubKey(Buffer.from('', i))).toBe(false);
        //     }
        // });
    });
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

                expect(minimalData(script)).toBe(true);
            });
        });

        function testEncodingForSize(num: number) {
            it(`compliant for data PUSH of length ${num}`, () => {
                const buffer = Buffer.alloc(num);
                const script = bscript.compile([buffer]);

                expect(minimalData(script)).toBe(true);
            });
        }

        for (let i = 0; i < 520; ++i) {
            testEncodingForSize(i);
        }
    });
});
