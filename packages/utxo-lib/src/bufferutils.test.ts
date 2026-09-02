import { fixtures } from './__fixtures__/bufferutils';
import * as bufferutils from './bufferutils';

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
                const fopcode = parseInt(f.hexPD.substring(0, 2), 16);

                if (d === null) throw new Error('expected non-null');
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
                }).toThrow(new RegExp(f.exception));
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
                }).toThrow(new RegExp(f.exception));
            });
        });
    });

    // TODO: not-used
    // eslint-disable-next-line jest/no-commented-out-tests
    // describe('varIntBuffer', () => {
    //     fixtures.valid.forEach(f => {
    // eslint-disable-next-line jest/no-commented-out-tests
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
                expect(buffer.subarray(0, n).toString('hex')).toEqual(f.hexPD);
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
                }).toThrow(new RegExp(f.exception));
            });
        });
    });

    describe('writeUInt64LEasString', () => {
        describe('string path', () => {
            fixtures.valid.forEach(f => {
                it(`encodes string "${f.dec}" correctly`, () => {
                    const buffer = Buffer.alloc(8, 0);

                    const n = bufferutils.writeUInt64LEasString(buffer, String(f.dec), 0);

                    expect(buffer.toString('hex')).toEqual(f.hex64);
                    expect(n).toEqual(8);
                });

                it(`round-trips string "${f.dec}" through readUInt64LEasString`, () => {
                    const buffer = Buffer.alloc(8, 0);

                    bufferutils.writeUInt64LEasString(buffer, String(f.dec), 0);

                    expect(bufferutils.readUInt64LEasString(buffer, 0)).toEqual(String(f.dec));
                });
            });
        });

        // These values exceed Number.MAX_SAFE_INTEGER (2^53 - 1), which is the actual
        // reason the string API exists. Round-trips through readUInt64LEasString must
        // hit the BN fallback because readUInt64LE throws above 2^53.
        describe('string path > Number.MAX_SAFE_INTEGER (BN fallback)', () => {
            [
                { dec: '9007199254740992', hex64: '0000000000002000' }, // 2^53
                { dec: '9007199254740993', hex64: '0100000000002000' }, // 2^53 + 1
                { dec: '18446744073709551615', hex64: 'ffffffffffffffff' }, // UINT64_MAX
            ].forEach(f => {
                it(`encodes "${f.dec}" correctly`, () => {
                    const buffer = Buffer.alloc(8, 0);

                    const n = bufferutils.writeUInt64LEasString(buffer, f.dec, 0);

                    expect(buffer.toString('hex')).toEqual(f.hex64);
                    expect(n).toEqual(8);
                });

                it(`round-trips "${f.dec}" through readUInt64LEasString (BN fallback)`, () => {
                    const buffer = Buffer.alloc(8, 0);

                    bufferutils.writeUInt64LEasString(buffer, f.dec, 0);

                    expect(bufferutils.readUInt64LEasString(buffer, 0)).toEqual(f.dec);
                });
            });
        });

        describe('number path (delegates to writeUInt64LE)', () => {
            fixtures.valid.forEach(f => {
                it(`encodes number ${f.dec} correctly`, () => {
                    const buffer = Buffer.alloc(8, 0);

                    const n = bufferutils.writeUInt64LEasString(buffer, f.dec, 0);

                    expect(buffer.toString('hex')).toEqual(f.hex64);
                    expect(n).toEqual(8);
                });
            });
        });

        describe('invalid string input', () => {
            [
                { description: 'non-numeric string', input: 'abc' },
                { description: 'empty string', input: '' },
                { description: 'overflow > UINT64_MAX', input: '99999999999999999999' },
            ].forEach(f => {
                it(`throws for ${f.description}`, () => {
                    const buffer = Buffer.alloc(8, 0);

                    expect(() => {
                        bufferutils.writeUInt64LEasString(buffer, f.input, 0);
                    }).toThrow();
                });
            });
        });
    });

    describe('writeInt64LE', () => {
        fixtures.valid.forEach(f => {
            it(`encodes positive ${f.dec} correctly`, () => {
                const buffer = Buffer.alloc(8, 0);

                const n = bufferutils.writeInt64LE(buffer, f.dec, 0);

                expect(buffer.toString('hex')).toEqual(f.hex64);
                expect(n).toEqual(8);
            });
        });

        // INT64_MIN is exercised separately below as a known overflow; safe negatives
        // go through the standard encode + round-trip path.
        fixtures.negative
            .filter(f => Number.isSafeInteger(f.dec))
            .forEach(f => {
                it(`encodes negative ${f.dec} correctly`, () => {
                    const buffer = Buffer.alloc(8, 0);

                    const n = bufferutils.writeInt64LE(buffer, f.dec, 0);

                    expect(buffer.toString('hex')).toEqual(f.hex64.toLowerCase());
                    expect(n).toEqual(8);
                });

                it(`round-trips negative ${f.dec} through readInt64LE`, () => {
                    const buffer = Buffer.alloc(8, 0);

                    bufferutils.writeInt64LE(buffer, f.dec, 0);

                    expect(bufferutils.readInt64LE(buffer, 0)).toEqual(f.dec);
                });
            });

        it('encodes INT64_MIN correctly', () => {
            const buffer = Buffer.alloc(8, 0);

            const n = bufferutils.writeInt64LE(buffer, -9223372036854775808, 0);

            expect(buffer.toString('hex')).toEqual('0000000000000080');
            expect(n).toEqual(8);
        });

        describe('invalid number input', () => {
            [
                { description: 'NaN', input: NaN },
                { description: 'Infinity', input: Infinity },
                { description: '-Infinity', input: -Infinity },
            ].forEach(f => {
                it(`throws for ${f.description}`, () => {
                    const buffer = Buffer.alloc(8, 0);

                    expect(() => {
                        bufferutils.writeInt64LE(buffer, f.input, 0);
                    }).toThrow();
                });
            });
        });
    });

    describe('writeVarInt', () => {
        fixtures.valid.forEach(f => {
            it(`encodes ${f.dec} correctly`, () => {
                const buffer = Buffer.alloc(9, 0);

                const n = bufferutils.writeVarInt(buffer, f.dec, 0);
                expect(buffer.subarray(0, n).toString('hex')).toEqual(f.hexVI);
            });
        });

        fixtures.invalid.readUInt64LE.forEach(f => {
            it(`throws on ${f.description}`, () => {
                const buffer = Buffer.alloc(9, 0);

                expect(() => {
                    bufferutils.writeVarInt(buffer, f.dec, 0);
                }).toThrow(new RegExp(f.exception));
            });
        });
    });
});
