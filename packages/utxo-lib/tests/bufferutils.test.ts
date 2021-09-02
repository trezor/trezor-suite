import * as bufferutils from '../src/bufferutils';
import { fixtures } from './__fixtures__/bufferutils';

describe('bufferutils', () => {
    describe('pushDataSize', () => {
        fixtures.valid.forEach(f => {
            it(`determines the pushDataSize of ${f.dec} correctly`, () => {
                if (!f.hexPD) return;

                const size = bufferutils.pushDataSize(f.dec);

                expect(size).toEqual(f.hexPD.length / 2);
            });
        });
    });

    describe('readPushDataInt', () => {
        fixtures.valid.forEach(f => {
            if (!f.hexPD) return;

            it(`decodes ${f.hexPD} correctly`, () => {
                const buffer = Buffer.from(f.hexPD, 'hex');
                const d = bufferutils.readPushDataInt(buffer, 0);
                const fopcode = parseInt(f.hexPD.substr(0, 2), 16);

                expect(d.opcode).toEqual(fopcode);
                expect(d.number).toEqual(f.dec);
                expect(d.size).toEqual(buffer.length);
            });
        });

        fixtures.invalid.readPushDataInt.forEach(f => {
            if (!f.hexPD) return;

            it(`decodes ${f.hexPD} as null`, () => {
                const buffer = Buffer.from(f.hexPD, 'hex');

                const n = bufferutils.readPushDataInt(buffer, 0);
                expect(n).toEqual(null);
            });
        });
    });

    describe('readInt64LE', () => {
        fixtures.negative.forEach(f => {
            it(`decodes ${f.hex64} correctly`, () => {
                const buffer = Buffer.from(f.hex64, 'hex');
                const number = bufferutils.readInt64LE(buffer, 0);

                expect(number).toEqual(f.dec);
            });
        });
    });

    describe('readUInt64LE', () => {
        fixtures.valid.forEach(f => {
            it(`decodes ${f.hex64} correctly`, () => {
                const buffer = Buffer.from(f.hex64, 'hex');
                const number = bufferutils.readUInt64LE(buffer, 0);

                expect(number).toEqual(f.dec);
            });
        });

        fixtures.invalid.readUInt64LE.forEach(f => {
            it(`throws on ${f.description}`, () => {
                const buffer = Buffer.from(f.hex64, 'hex');

                expect(() => {
                    bufferutils.readUInt64LE(buffer, 0);
                }).toThrowError(new RegExp(f.exception));
            });
        });
    });

    describe('readVarInt', () => {
        fixtures.valid.forEach(f => {
            it(`decodes ${f.hexVI} correctly`, () => {
                const buffer = Buffer.from(f.hexVI, 'hex');
                const d = bufferutils.readVarInt(buffer, 0);

                expect(d.number).toEqual(f.dec);
                expect(d.size).toEqual(buffer.length);
            });
        });

        fixtures.invalid.readUInt64LE.forEach(f => {
            it(`throws on ${f.description}`, () => {
                const buffer = Buffer.from(f.hexVI, 'hex');

                expect(() => {
                    bufferutils.readVarInt(buffer, 0);
                }).toThrowError(new RegExp(f.exception));
            });
        });
    });

    // TODO: not-used
    // describe('varIntBuffer', () => {
    //     fixtures.valid.forEach(f => {
    //         it(`encodes ${f.dec} correctly`, () => {
    //             const buffer = bufferutils.varIntBuffer(f.dec);

    //             expect(buffer.toString('hex')).toEqual(f.hexVI);
    //         });
    //     });
    // });

    describe('varIntSize', () => {
        fixtures.valid.forEach(f => {
            it(`determines the varIntSize of ${f.dec} correctly`, () => {
                const size = bufferutils.varIntSize(f.dec);

                expect(size).toEqual(f.hexVI.length / 2);
            });
        });
    });

    describe('writePushDataInt', () => {
        fixtures.valid.forEach(f => {
            if (!f.hexPD) return;

            it(`encodes ${f.dec} correctly`, () => {
                const buffer = Buffer.alloc(5, 0);

                const n = bufferutils.writePushDataInt(buffer, f.dec, 0);
                expect(buffer.slice(0, n).toString('hex')).toEqual(f.hexPD);
            });
        });
    });

    describe('writeUInt64LE', () => {
        fixtures.valid.forEach(f => {
            it(`encodes ${f.dec} correctly`, () => {
                const buffer = Buffer.alloc(8, 0);

                bufferutils.writeUInt64LE(buffer, f.dec, 0);
                expect(buffer.toString('hex')).toEqual(f.hex64);
            });
        });

        fixtures.invalid.readUInt64LE.forEach(f => {
            it(`throws on ${f.description}`, () => {
                const buffer = Buffer.alloc(8, 0);

                expect(() => {
                    bufferutils.writeUInt64LE(buffer, f.dec, 0);
                }).toThrowError(new RegExp(f.exception));
            });
        });
    });

    describe('writeVarInt', () => {
        fixtures.valid.forEach(f => {
            it(`encodes ${f.dec} correctly`, () => {
                const buffer = Buffer.alloc(9, 0);

                const n = bufferutils.writeVarInt(buffer, f.dec, 0);
                expect(buffer.slice(0, n).toString('hex')).toEqual(f.hexVI);
            });
        });

        fixtures.invalid.readUInt64LE.forEach(f => {
            it(`throws on ${f.description}`, () => {
                const buffer = Buffer.alloc(9, 0);

                expect(() => {
                    bufferutils.writeVarInt(buffer, f.dec, 0);
                }).toThrowError(new RegExp(f.exception));
            });
        });
    });
});
