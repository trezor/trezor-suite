import * as bscriptSig from '../src/script/scriptSignature';
import { fixtures } from './__fixtures__/scriptSignature';

describe('Script Signatures', () => {
    function fromRaw(signature: { r: string; s: string }): Buffer {
        return Buffer.concat(
            [Buffer.from(signature.r, 'hex'), Buffer.from(signature.s, 'hex')],
            64,
        );
    }

    function toRaw(signature: Buffer): {
        r: string;
        s: string;
    } {
        return {
            r: signature.slice(0, 32).toString('hex'),
            s: signature.slice(32, 64).toString('hex'),
        };
    }

    describe('encode', () => {
        fixtures.valid.forEach(f => {
            it(`encodes ${f.hex}`, () => {
                const buffer = bscriptSig.encode(fromRaw(f.raw), f.hashType);
                expect(buffer.toString('hex')).toEqual(f.hex);
            });
        });

        fixtures.invalid.forEach(f => {
            if (!f.raw) return;

            it(`throws ${f.exception}`, () => {
                const signature = fromRaw(f.raw);
                expect(() => bscriptSig.encode(signature, f.hashType)).toThrow(f.exception);
            });
        });
    });

    describe('decode', () => {
        fixtures.valid.forEach(f => {
            it(`decodes ${f.hex}`, () => {
                const decode = bscriptSig.decode(Buffer.from(f.hex, 'hex'));

                expect(toRaw(decode.signature)).toEqual(f.raw);
                expect(decode.hashType).toEqual(f.hashType);
            });
        });

        fixtures.invalid.forEach(f => {
            it(`throws on ${f.hex}`, () => {
                const buffer = Buffer.from(f.hex, 'hex');

                expect(() => bscriptSig.decode(buffer)).toThrow(f.exception);
            });
        });
    });
});
